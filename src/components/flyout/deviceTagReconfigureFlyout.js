// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';

import lang from '../../common/lang';
import * as actions from '../../actions';
import Trash from '../../assets/icons/Trash.svg';
import Add from '../../assets/icons/Add.svg';
import Select from 'react-select';
import Rx from 'rxjs';
import * as uuid from 'uuid/v4';
import CancelX from '../../assets/icons/CancelX.svg';
import Apply from '../../assets/icons/Apply.svg';
import ApiService from '../../common/apiService';
import Config from '../../common/config';
import {sanitizeJobName} from '../../common/utils';
import Spinner from '../spinner/spinner';
import DeepLinkSection from '../deepLinkSection/deepLinkSection';
import PcsBtn from '../shared/pcsBtn/pcsBtn';
import SummarySection from '../shared/summarySection/summarySection';

import './deviceReconfigureFlyout.css';

const isNumeric = value => typeof value === 'number' || !isNaN(parseInt(value, 10));

const getRelatedJobs = (devices, twinUpdateJobs) => {
  if (!devices || !twinUpdateJobs || !devices.length || !twinUpdateJobs.length) return [];
  return twinUpdateJobs.filter(job => devices.some(({ Id }) => job.deviceIds.indexOf(Id) !== -1));
}

const typeOptions = [
  {
    value: 'Number',
    label: lang.NUMBER
  },
  {
    value: 'Text',
    label: lang.TEXT
  }
];

class DeviceTagReconfigureFlyout extends React.Component {
  constructor() {
    super();
    this.inputReferences = {};
    this.state = {
      commonReconfigure: [],
      deletedReconfigureNames: {},
      jobInputValue: '',
      overiddenDeviceReconfigureValues: {
        //key will be device Id and value will be Reconfigure name/value map
      },
      newReconfigure: [], //{name, value, type}
      commonReconfigureValues: {},
      commonReconfigureTypes: [],
      showCreateFilter: false,
      jobApplied: false,
      jobId: ''
    };
    this.addNewReconfigure = this.addNewReconfigure.bind(this);
    this.deleteExistingReconfigure = this.deleteExistingReconfigure.bind(this);
    this.deleteNewReconfigure = this.deleteNewReconfigure.bind(this);
    this.commonReconfigureValueChanged = this.commonReconfigureValueChanged.bind(this);
    this.onChangeInput = this.onChangeInput.bind(this);
    this.applyDeviceReconfigureJobsData = this.applyDeviceReconfigureJobsData.bind(this);
    this.checkJobStatus = this.checkJobStatus.bind(this);
  }

  componentDidMount() {
		const { devices, propertyUpdateJobs } = this.props;
    this.checkJobStatus(devices, propertyUpdateJobs);
    if (this.props.overiddenDeviceReconfigureValues) {
      this.setState({ overiddenDeviceReconfigureValues: this.props.overiddenDeviceReconfigureValues });
    }
    this.computeState(this.props);
		this.calcCommonConfiguration(devices);
  }

  computeState(nextProps) {
    const { devices } = nextProps;
    const { overiddenDeviceReconfigureValues } = this.state;

    /**
     * A helper method to merge two Reconfigure objects
     */
    const mergeReconfigure = (existingReconfigure, existingReconfigure) => {
      return {
        ...(existingReconfigure || {}),
        ...(existingReconfigure || {})
      };
    };

    // Create a stream of devices
    const deviceStream = Rx.Observable.of(devices).flatMap(_ => _);
    deviceStream
      // Convert the device stream into a stream of tab names
      .flatMap(device => Object.keys(mergeReconfigure(device.Properties.Reported, overiddenDeviceReconfigureValues[device.Id])))
      // Remove duplicate Reconfigure names from the stream
      .distinct()
      // Extract only the common Reconfigure names
      .filter(ReconfigureName =>
        devices.every(device => (typeof (mergeReconfigure(device.Properties.Reported, overiddenDeviceReconfigureValues[device.Id])[ReconfigureName]) !== 'undefined'))
      )
      // Compute the Reconfigure values for each Reconfigure name into a map
      .flatMap(ReconfigureName =>
        deviceStream
          .map(device => {
            // Explicitly check undefined because empty string is valid
            return mergeReconfigure(device.Properties.Reported, overiddenDeviceReconfigureValues[device.Id])[ReconfigureName];
          })
          .distinct()
          .filter(value => value !== undefined)
          .reduce((acc, curr) => [...acc, curr], [])
          .map(values => ({ ReconfigureName: ReconfigureName, values: values }))
      )
      // Construct the new component state
      .reduce(
        (newState, { ReconfigureName, values }) => {
          newState.commonReconfigure.push(ReconfigureName);
          newState.commonReconfigureValues[ReconfigureName] = values.length === 1 ? values[0] : 'Multiple';
          if (values.every(isNumeric)) {
            newState.commonReconfigureTypes[ReconfigureName] = 'Number';
          } else {
            newState.commonReconfigureTypes[ReconfigureName] = 'Text';
          }
          return newState;
        },
        { commonReconfigure: [], commonReconfigureValues: {}, commonReconfigureTypes: {} }
      )
      // Update the component state
      .subscribe(newState => {
        this.setState({ ...newState }, () => {});
      });
  }

	componentWillReceiveProps(nextProps) {
		const { devices, propertyUpdateJobs } = nextProps;
		if (!_.isEqual(propertyUpdateJobs, this.props.propertyUpdateJobs)) {
			this.checkJobStatus(devices, propertyUpdateJobs);
		}
		if (!_.isEqual(devices, this.props.devices)) {
			this.calcCommonConfiguration(devices);
		}
	}

	checkJobStatus (devices, propertyUpdateJobs) {
    if(!devices || !propertyUpdateJobs || !devices.length || !propertyUpdateJobs.length) return;
    const jobs = getRelatedJobs(devices, propertyUpdateJobs);
    const deviceIdSet = new Set(devices.map(({Id}) => Id));
    Rx.Observable.from(jobs)
      .flatMap(({ jobId, deviceIds }) =>
        Rx.Observable
          .fromPromise(ApiService.getJobStatus(jobId))
          // Get completed jobs
          .filter(({ status }) => status === 3)
          .do(_ => this.props.actions.removePropertyJob(jobId))
          .flatMap(_ => deviceIds)
      )
      .distinct()
      .filter(deviceId => deviceIdSet.has(deviceId))
      .flatMap(deviceId => ApiService.getDeviceById(deviceId))
      .reduce((devices, device) => [...devices, device], [])
      .subscribe(
        devices => {
          this.props.actions.updateDevicesItems(devices);
          this.props.actions.updateDevices(devices)
        },
        error => console.log('error', error)
      );
  }

  commonReconfigureValueChanged(ReconfigureName, evt) {
    const { devices } = this.props;
    const devicesToBeUpdated = devices.filter(device => {
      return device.Properties.Reported && typeof device.Properties.Reported[ReconfigureName] !== 'undefined';
    });
    this.saveChangedTagValues(devicesToBeUpdated, ReconfigureName, evt.target.value);
  }

  applyChangedData() {
    const { newReconfigure, overiddenDeviceReconfigureValues } = this.state;
    const { deviceEReconfigure } = this.props;
    newReconfigure.forEach(Reconfigure => {
      this.props.devices.forEach(device => {
        overiddenDeviceReconfigureValues[device.Id] = {
          ...overiddenDeviceReconfigureValues[device.Id],
          [Reconfigure.name]: Reconfigure.value
        };
      });
    });

    this.setState({ newReconfigure: [], overiddenDeviceReconfigureValues }, () => this.computeState(this.props));
    const devices = _.cloneDeep(this.props.devices);
    devices.forEach(device => (device.EReconfigure = deviceETags[device.Id] ? deviceETags[device.Id] : device.EReconfigure));
    this.props.actions.deviceListCommonReconfigureValueChanged(devices, overiddenDeviceReconfigureValues);
  }

  saveChangedTagValues(devices, ReconfigureName, value) {
    const overiddenDeviceReconfigureValues = this.state.overiddenDeviceReconfigureValues;
    devices.forEach(device => {
      const ReconfigureNameValue = overiddenDeviceReconfigureValues[device.Id] || (overiddenDeviceReconfigureValues[device.Id] = {});
      ReconfigureNameValue[ReconfigureName] = value;
    });
    this.setState({ overiddenDeviceReconfigureValues }, () => this.computeState(this.props));
  }

  deleteNewReconfigure(idx) {
    let { newReconfigure } = this.state;
    newReconfigure.splice(idx, 1);
    this.setState({
      newReconfigure: newReconfigure
    });
  }

  onChangeInput(event) {
    this.setState({ jobInputValue: sanitizeJobName(event.target.value || '') });
  }

  applyDeviceReconfigureJobsData() {
    const { devices } = this.props;
    const { newReconfigure, deletedReconfigureNames, commonReconfigureValues } = this.state;
    const deviceIds = devices.map(({ Id }) => `'${Id}'`).join(',');
    const Reconfigures = {
      ...commonReconfigureValues,
      ...deletedReconfigureNames,
    };

    newReconfigure.forEach(Reconfigure => {
      Reconfigures[Reconfigure.name] = Reconfigure.value;
    });
    const payload = {
      JobId: this.state.jobInputValue ? this.state.jobInputValue + '-' + uuid(): uuid(),
      QueryCondition: `deviceId in [${deviceIds}]`,
      MaxExecutionTimeInSeconds: 0,
      updateTwin: {
        Reconfigures
      }
    };
    this.setState({ showSpinner: true });
    ApiService.scheduleJobs(payload).then(({ jobId }) => {
        this.props.actions.updateTwinJobs({
          jobId,
          deviceIds : devices.map(({ Id }) => Id)
        });
        this.setState({
          showSpinner: false,
          jobApplied: true,
          jobId
        })
      }
    );
  }

  setTagProperty(Reconfigure, property, value) {
    Reconfigure[property] = value;
    this.setState({});
  }

  renderNewReconfigure() {
    const { newReconfigure } = this.state;
    return (
      <div>
        {newReconfigure.map((Reconfigure, idx) =>
          <div key={idx}>
            <div className="all-conditions">
              <input
                type="text"
                className="condition-name"
                value={Reconfigure.name}
                onChange={evt => this.setTagProperty(Reconfigure, 'name', evt.target.value)}
                placeholder={lang.NAME}
              />
              <input
                type="text"
                className="condition-value"
                value={Reconfigure.value}
                onChange={evt => this.setTagProperty(Reconfigure, 'value', evt.target.value)}
                placeholder={lang.VALUE}
              />
              <span className="device-Reconfigure-type">
                <Select
                  autofocus
                  options={typeOptions}
                  value={Reconfigure.type}
                  simpleValue
                  onChange={val => this.setTagProperty(Reconfigure, 'type', val)}
                  searchable={true}
                  placeholder={lang.TYPE}
                  className="select-style-manage"
                />
              </span>
              <span>
                <img src={Trash} onClick={() => this.deleteNewReconfigure(idx)} alt={`${Trash}`} className="delete-icon" />
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  renderCommonReconfigure() {
    const { commonReconfigure, commonReconfigureValues, commonReconfigureTypes, deletedReconfigureNames } = this.state;
    return (
      <div className="common-Tags">
        {commonReconfigure.filter(ReconfigureName => !(ReconfigureName in deletedReconfigureNames)).map((ReconfigureName, idx) => {
          return (
            <div className="device-Tag-items name-value-type" key={ReconfigureName} onClick={() => {this.inputReferences[idx] && this.inputReferences[idx].focus()}}>
              <span className="device-Tag">
                {ReconfigureName}
              </span>
              {ReconfigureName !== Config.STATUS_CODES.FIRMWARE
                ? <input
                    type="text"
                    className="device-Tag value-for-existed-data"
                    onChange={evt => this.commonReconfigureValueChanged(ReconfigureName, evt)}
                    value={commonReconfigureValues[ReconfigureName]}
                    ref={(ip) => this.inputReferences[idx] = ip}
                  />
                : <span>
                    {commonReconfigureValues[ReconfigureName]}
                  </span>}
              <span className="device-Tag value-for-existed-data">
                {commonReconfigureTypes[ReconfigureName]}
              </span>
              <span className="device-Tag trash-icon-for-existed-data">
                <img
                  src={Trash}
                  onClick={() => this.deleteExistingReconfigure(ReconfigureName)}
                  alt={`${Trash}`}
                  className="delete-icon"
                />
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  deleteExistingReconfigure(ReconfigureName) {
    this.setState({
      deletedReconfigureNames: {
        ...this.state.deletedReconfigureNames,
        [ReconfigureName]: null
      }
    });
  }

	calcCommonConfiguration(devices) {
    const commonConfiguration = [];
    if (!devices) return;
    const uncommonReportedPropValueMap = {};
    /*
    If user selected only one device then it returns all the value from Properties.Reported
    'validReportedProperties' is the type, location and firmware. So taking each key and
    checking wheather the value is present or undefined. It's not mandatory that it should
    have all three.
    */
    if (devices.length === 1) {
      const device = devices[0];
      if (device && device.Properties && device.Properties.Reported) {
        const { Reported, Desired } = device.Properties;
        validReportedProperties.forEach(key => {
          if (Reported[key] !== undefined) {
            commonConfiguration.push({
              label: key,
              value: (Desired[key] && Desired[key] !== Reported[key]) ? `${Reported[key]} ${lang.SYNCING} ${Desired[key]}` : Reported[key],
              type: getTypeOf(Reported[key]),
              desired: Desired[key] ? true : false
            });
          }
        });
      }
    } else {
    /*
    When user selected multiple devices then, we have to look for validReportedProperties and
    What ever is common return only those validReportedProperties. Sometimes the values of
    those type, location can be different in that Make it value as "Multiple".
    */
      devices.forEach(device => {
        validReportedProperties.forEach(reportedProp => {
          if (!device || !device.Properties || !device.Properties.Reported) {
            uncommonReportedPropValueMap[reportedProp] = true;
            return;
          }
          const { Reported } = device.Properties;
          if (Reported[reportedProp] === undefined || Reported[reportedProp] === null) {
            uncommonReportedPropValueMap[reportedProp] = true;
          }
        });
      });

      // Compute the common property value per reported property across selected devices
      const valuesMap = {};
      devices.forEach(device => {
        if (!device || !device.Properties || !device.Properties.Reported) return;
        const { Reported, Desired } = device.Properties;
        validReportedProperties.forEach(reportedProp => {
          if (uncommonReportedPropValueMap[reportedProp]) return;
          if (Reported[reportedProp] !== undefined) {
            const commonValue = valuesMap[reportedProp] === Reported[reportedProp] ? valuesMap[reportedProp] : lang.MULTIPLE;
            if (valuesMap[reportedProp] !== undefined) {
              // If the values are shared across devices, show the value, if not, show 'Multiple'
              valuesMap[reportedProp] = commonValue;
            } else {
              valuesMap[reportedProp] = Reported[reportedProp];
            }
            if (Desired[reportedProp] && Reported[reportedProp] !== Desired[reportedProp]) {
              valuesMap[reportedProp] = commonValue === lang.MULTIPLE ? `${commonValue} ${lang.SYNCING}` : `${commonValue} ${lang.SYNCING} ${Desired[reportedProp]}`
            }
          }
        });
      });

      Object.keys(valuesMap).forEach(key => {
        commonConfiguration.push({
          label: key,
          value: valuesMap[key],
          type: getTypeOf(valuesMap[key]),
          desired: valuesMap[key].indexOf(lang.SYNCING) !== -1
        });
      });
    }

    this.setState({ commonConfiguration });
  }

  addNewReconfigure() {
    this.setState({
      newReconfigure: [{ name: '', value: '', type: 'String' }, ...this.state.newReconfigure]
    });
  }

  render() {
    const deepLinkSectionProps = {
      path: `/maintenance/job/${this.state.jobId}`,
      description: lang.VIEW_JOB_STATUS,
      linkText: lang.VIEW
    };
    const disabledButton = !this.state.jobInputValue;
    let totalAffectedDevices = this.props.devices ? this.props.devices.length : 0;
    const { commonReconfigure } = this.state;
    return (
      <div className="device-Reconfigure-flyout-container">
        <div className="sub-heading">
          {lang.TAGS_ON_SELECTED_DEVICES}
        </div>
        <div className="sub-class-heading">
          {lang.TAGS_IN_COMMON_SELECTED_DEVICE}
        </div>
        <div className="job-name-container">
          <label>
            <div className="label-key">
              {lang.JOB_NAME}
            </div>
            <input type="text" className="style-manage" placeholder={lang.ADJUST_TAGS} onChange={this.onChangeInput}
            value={this.state.jobInputValue}/>
            <div className="jobname-reference">
              <span className="asterisk">*</span>
              {lang.JOB_NAME_REFERENCE}
            </div>
          </label>
        </div>
        <div className="device-conditions-container">
          <span className="device-condition">
            {lang.NAME}
          </span>
          <span className="device-condition">
            {lang.VALUE}
          </span>
          <span className="device-condition">
            {lang.TYPE}
          </span>
        </div>
        <div className="device-Reconfigure-inner-conditions">
          <div className="add-icon-name-container" onClick={this.addNewReconfigure}>
            <img src={Add} alt={`${Add}`} className="add-icon" />
            <span className="add-device-Reconfigure">
              {lang.ADD_TAG}
            </span>
          </div>

          {this.renderNewReconfigure()}
        </div>
        {commonReconfigure.length
          ? this.renderCommonReconfigure()
          : <div>
              <div className="no-common-Reconfigures">
                {lang.NO_AVAILABLE_COMMON_TAGS}
              </div>
              <div className="no-common-Reconfigures-sub-class">
                {lang.PLEASE_CHOOSE_DEVICES_WITH_COMMON_TAGS}
              </div>
            </div>}

        <SummarySection count={totalAffectedDevices} content={lang.AFFECTED_DEVICES} />
        <div className="button-container">
          <PcsBtn svg={CancelX} onClick={this.props.onClose}>{lang.CANCEL}</PcsBtn>
          {this.state.showSpinner && <Spinner size="medium" />}
          {this.state.jobApplied
            ? <PcsBtn svg={Apply} value={lang.APPLIED} disabled />
            : <PcsBtn
                className="primary"
                svg={Apply}
                value={lang.APPLY}
                disabled={disabledButton}
                onClick={this.applyDeviceReconfigureJobsData}/> }
        </div>
        {this.state.jobApplied ? <DeepLinkSection {...deepLinkSectionProps}/> : null}
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    actions: bindActionCreators(actions, dispatch)
  };
};

const mapStateToProps = (state, ownProps) => {
  return {
    devices: state.flyoutReducer.devices,
    deviceETags: state.flyoutReducer.deviceETags || {},
    overiddenDeviceReconfigureValues: state.flyoutReducer.overiddenDeviceReconfigureValues,
    requestInProgress: state.flyoutReducer.requestInProgress,
    twinUpdateJobs: state.systemStatusJobReducer.twinUpdateJobs
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DeviceTagReconfigureFlyout);
