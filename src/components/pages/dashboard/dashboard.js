// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { Observable, Subject } from 'rxjs';
import moment from 'moment';

import Config from 'app.config';
import { TelemetryService } from 'services';
import { compareByProperty } from 'utilities';
import { Grid, Cell } from './grid';
import { PanelErrorBoundary } from './panel';
import {
  OverviewPanel,
  AlarmsPanel,
  TelemetryPanel,
  KpisPanel,
  MapPanel,
  transformTelemetryResponse
} from './panels';
import { ContextMenu, PageContent, RefreshBar } from 'components/shared';

import './dashboard.css';

const chartColors = [
  '#01B8AA',
  '#F2C80F',
  '#E81123',
  '#3599B8',
  '#33669A',
  '#26FFDE',
  '#E0E7EE',
  '#FDA954',
  '#FD625E',
  '#FF4EC2',
  '#FFEE91'
];

const initialState = {
  chartColors,

  // Telemetry data
  telemetry: {},
  telemetryIsPending: true,
  telemetryError: null,

  // Kpis data
  currentActiveAlarms: [],
  topAlarms: [],
  alarmsPerDeviceId: {},
  criticalAlarmsChange: 0,
  kpisIsPending: true,
  kpisError: null,

  // Summary data
  openWarningCount: undefined,
  openCriticalCount: undefined,

  // Map data
  devicesInAlarm: {},

  lastRefreshed: undefined
};

export class Dashboard extends Component {

  constructor(props) {
    super(props);

    this.state = initialState;

    this.subscriptions = [];
    this.dashboardRefresh$ = new Subject(); // Restarts all streams
    this.telemetryRefresh$ = new Subject();
    this.panelsRefresh$ = new Subject();
  }

  componentDidMount() {
    // Load the rules
    this.props.fetchRules();

    // Telemetry stream - START
    const onPendingStart = () => this.setState({ telemetryIsPending: true });

    const telemetry$ = TelemetryService.getTelemetryByDeviceIdP15M()
      .merge(
        this.telemetryRefresh$ // Previous request complete
          .delay(Config.telemetryRefreshInterval) // Wait to refresh
          .do(onPendingStart)
          .flatMap(_ => TelemetryService.getTelemetryByDeviceIdP1M())
      )
      .flatMap(transformTelemetryResponse(() => this.state.telemetry))
      .map(telemetry => ({ telemetry, telemetryIsPending: false })); // Stream emits new state
      // Telemetry stream - END

      // KPI stream - START
      const currentFrom = 'NOW-PT1H';
      const previousFrom = 'NOW-PT2H';

      const currentParams = { from: currentFrom, to: 'NOW' };
      const previousParams = { from: previousFrom, to: currentFrom };

      // TODO: Add device ids to params - START
      const kpis$ = this.panelsRefresh$
        .delay(Config.dashboardRefreshInterval)
        .startWith(0)
        .do(_ => this.setState({ kpisIsPending: true }))
        .flatMap(_ =>
          Observable.forkJoin(
            TelemetryService.getActiveAlarms(currentParams),
            TelemetryService.getActiveAlarms(previousParams),

            TelemetryService.getAlarms(currentParams),
            TelemetryService.getAlarms(previousParams)
          )
        ).map(([
          currentActiveAlarms,
          previousActiveAlarms,

          currentAlarms,
          previousAlarms
        ]) => {
          // Process all the data out of the currentAlarms list
          const currentAlarmsStats = currentAlarms.reduce((acc, alarm) => {
              const isOpen = alarm.status === 'open';
              const isWarning = alarm.severity === 'warning';
              const isCritical = alarm.severity === 'critical';
              let updatedAlarmsPerDeviceId = acc.alarmsPerDeviceId;
              if (alarm.deviceId) {
                updatedAlarmsPerDeviceId = {
                  ...updatedAlarmsPerDeviceId,
                  [alarm.deviceId]: (updatedAlarmsPerDeviceId[alarm.deviceId] || 0) + 1
                };
              }
              return {
                openWarningCount: (acc.openWarningCount || 0) + (isWarning && isOpen ? 1 : 0),
                openCriticalCount: (acc.openCriticalCount || 0) + (isCritical && isOpen ? 1 : 0),
                totalCriticalCount: (acc.totalCriticalCount || 0) + (isCritical ? 1 : 0),
                alarmsPerDeviceId: updatedAlarmsPerDeviceId
              };
            },
            { alarmsPerDeviceId: {} }
          );

          // ================== Critical Alarms Count - START
          const currentCriticalAlarms = currentAlarmsStats.totalCriticalCount;
          const previousCriticalAlarms = previousAlarms.reduce(
            (cnt, { severity }) => severity === 'critical' ? cnt + 1 : cnt,
            0
          );
          const criticalAlarmsChange = ((currentCriticalAlarms - previousCriticalAlarms) / currentCriticalAlarms * 100).toFixed(2);
          // ================== Critical Alarms Count - END

          // ================== Top Alarms - START
          const currentTopAlarms = currentActiveAlarms
            .sort(compareByProperty('count'))
            .slice(0, Config.maxTopAlarms);

          // Find the previous counts for the current top kpis
          const previousTopAlarmsMap = previousActiveAlarms.reduce(
            (acc, { ruleId, count }) =>
              (ruleId in acc)
                ? { ...acc, [ruleId]: count }
                : acc
            ,
            currentTopAlarms.reduce((acc, { ruleId }) => ({ ...acc, [ruleId]: 0 }), {})
          );

          const topAlarms = currentTopAlarms.map(({ ruleId, count }) => ({
            ruleId,
            count,
            previousCount: previousTopAlarmsMap[ruleId] || 0
          }));
          // ================== Top Alarms - END

          const devicesInAlarm = currentAlarms
            .filter(({ status }) => status === 'open')
            .reduce((acc, { deviceId, severity, ruleId}) => {
              return {
                ...acc,
                [deviceId]: { severity, ruleId }
              };
            }, {});

          return ({
            kpisIsPending: false,

            // Kpis data
            currentActiveAlarms,
            topAlarms,
            criticalAlarmsChange,
            alarmsPerDeviceId: currentAlarmsStats.alarmsPerDeviceId,

            // Summary data
            openWarningCount: currentAlarmsStats.openWarningCount,
            openCriticalCount: currentAlarmsStats.openCriticalCount,

            // Map data
            devicesInAlarm
          });
        });
      // KPI stream - END

      this.subscriptions.push(
        this.dashboardRefresh$
          .subscribe(() => this.setState(initialState))
      );

      this.subscriptions.push(
        this.dashboardRefresh$
          .switchMap(() => telemetry$)
          .subscribe(
            telemetryState => this.setState(
              { ...telemetryState, lastRefreshed: moment() },
              () => this.telemetryRefresh$.next('r')
            ),
            telemetryError => this.setState({ telemetryError, telemetryIsPending: false })
          )
      );

      this.subscriptions.push(
        this.dashboardRefresh$
          .switchMap(() => kpis$)
          .subscribe(
            kpiState => this.setState(
              { ...kpiState, lastRefreshed: moment() },
              () => this.panelsRefresh$.next('r')
            ),
            kpisError => this.setState({ kpisError, kpisIsPending: false })
          )
      );

      // Start polling all panels
      this.dashboardRefresh$.next('r');
  }

  componentWillUnmount() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  refreshDashboard = () => this.dashboardRefresh$.next('r');

  render () {
    const {
      azureMapsKey,
      azureMapsKeyError,
      azureMapsKeyIsPending,

      devices,
      devicesError,
      devicesIsPending,

      rules,
      rulesError,
      rulesIsPending,
      t
    } = this.props;
    const {
      chartColors,

      telemetry,
      telemetryIsPending,
      telemetryError,

      currentActiveAlarms,
      topAlarms,
      alarmsPerDeviceId,
      criticalAlarmsChange,
      kpisIsPending,
      kpisError,

      openWarningCount,
      openCriticalCount,

      devicesInAlarm,

      lastRefreshed
    } = this.state;

    // Count the number of online and offline devices
    const deviceIds = Object.keys(devices);
    const onlineDeviceCount =
      deviceIds.length
        ? deviceIds.reduce((count, deviceId) => devices[deviceId].connected ? count + 1 : count, 0)
        : undefined;
    const offlineDeviceCount =
      deviceIds.length
        ? deviceIds.length - onlineDeviceCount
        : undefined;

    // Add the alarm rule name to the list of top alarms
    const topAlarmsWithName = topAlarms.map(alarm => ({
      ...alarm,
      name: (rules[alarm.ruleId] || {}).name || alarm.ruleId,
    }));

    // Add the alarm rule name to the list of currently active alarms
    const currentActiveAlarmsWithName = currentActiveAlarms.map(alarm => ({
      ...alarm,
      name: (rules[alarm.ruleId] || {}).name || alarm.ruleId
    }));

    // Convert the list of alarms by device id to alarms by device type
    const alarmsPerDeviceType = Object.keys(alarmsPerDeviceId).reduce((acc, deviceId) => {
      const deviceType = (devices[deviceId] || {}).type || deviceId;
      return {
        ...acc,
        [deviceType]: (acc[deviceType] || 0) + alarmsPerDeviceId[deviceId]
      };
    }, {});

    return [
      <ContextMenu key="context-menu">
        <RefreshBar
          refresh={this.refreshDashboard}
          time={lastRefreshed}
          isPending={kpisIsPending || devicesIsPending}
          t={t} />
      </ContextMenu>,
      <PageContent className="dashboard-container" key="page-content">
        <Grid>
          <Cell className="col-1 devices-overview-cell">
            <OverviewPanel
              openWarningCount={openWarningCount}
              openCriticalCount={openCriticalCount}
              onlineDeviceCount={onlineDeviceCount}
              offlineDeviceCount={offlineDeviceCount}
              isPending={kpisIsPending || devicesIsPending}
              error={devicesError || kpisError}
              t={t} />
          </Cell>
          <Cell className="col-5">
            <PanelErrorBoundary msg={t('dashboard.panels.map.runtimeError')}>
              <MapPanel
                azureMapsKey={azureMapsKey}
                devices={devices}
                devicesInAlarm={devicesInAlarm}
                mapKeyIsPending={azureMapsKeyIsPending}
                isPending={devicesIsPending || kpisIsPending}
                error={azureMapsKeyError || devicesError || kpisError}
                t={t} />
            </PanelErrorBoundary>
          </Cell>
          <Cell className="col-3">
            <AlarmsPanel
              alarms={currentActiveAlarmsWithName}
              isPending={kpisIsPending || rulesIsPending}
              error={rulesError || kpisError}
              t={t} />
          </Cell>
          <Cell className="col-6">
            <TelemetryPanel
              telemetry={telemetry}
              isPending={telemetryIsPending}
              error={telemetryError}
              colors={chartColors}
              t={t} />
          </Cell>
          <Cell className="col-4">
            <KpisPanel
              topAlarms={topAlarmsWithName}
              alarmsPerDeviceId={alarmsPerDeviceType}
              criticalAlarmsChange={criticalAlarmsChange}
              isPending={kpisIsPending || rulesIsPending || devicesIsPending}
              error={devicesError || rulesError || kpisError}
              colors={chartColors}
              t={t} />
          </Cell>
        </Grid>
      </PageContent>
    ];
  }
}
