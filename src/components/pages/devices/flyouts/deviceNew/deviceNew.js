// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import update from 'immutability-helper';

import { IoTHubManagerService } from 'services';
import {
  copyToClipboard,
  int,
  isEmptyObject,
  LinkedComponent,
  stringToBoolean,
  svgs,
  Validator
} from 'utilities';
import { Svg } from 'components/shared/svg/svg';
import {
  Btn,
  BtnToolbar,
  ErrorMsg,
  Flyout,
  FlyoutHeader,
  FlyoutTitle,
  FlyoutCloseBtn,
  FlyoutContent,
  FormControl,
  FormGroup,
  FormLabel,
  FormSection,
  Indicator,
  Radio,
  SectionDesc,
  SectionHeader,
  SummaryCount,
  SummarySection
} from 'components/shared';

import './deviceNew.css';

const isIntRegex = /^-?\d*$/;
const nonInteger = x => !x.match(isIntRegex);
const stringToInt = x => x === '' || x === '-' ? x : int(x);

const DeviceTypeOptions = {
  "labelName": "devices.flyouts.new.deviceType.label",
  "simulated": {
    "labelName": "devices.flyouts.new.deviceType.simulated",
    "value": true
  },
  "physical": {
    "labelName": "devices.flyouts.new.deviceType.physical",
    "value": false
  }
};

const DeviceIdTypeOptions = {
  "labelName": "devices.flyouts.new.deviceId.label",
  "manual": {
    "hintName": "devices.flyouts.new.deviceId.hint",
    "value": false
  },
  "generate": {
    "labelName": "devices.flyouts.new.deviceId.sysGenerated",
    "value": true
  }
};

const AuthTypeOptions = {
  "labelName": "devices.flyouts.new.authenticationType.label",
  "symmetric": {
    "labelName": "devices.flyouts.new.authenticationType.symmetric",
    "value": 0
  },
  "x509": {
    "labelName": "devices.flyouts.new.authenticationType.x509",
    "value": 1
  }
};

const AuthKeyTypeOptions = {
  "labelName": "devices.flyouts.new.authenticationKey.label",
  "generate": {
    "labelName": "devices.flyouts.new.authenticationKey.generateKeys",
    "value": true
  },
  "manual": {
    "labelName": "devices.flyouts.new.authenticationKey.manualKeys",
    "value": false
  }
};


const DeviceDetail = ({ label, value }) => (
  <FormSection className="device-detail">
    <SectionHeader>{label}</SectionHeader>
    <div className="device-detail-contents">
      <div className="device-detail-value">{value}</div>
      <Svg className="copy-icon" path={svgs.copy} onClick={() => copyToClipboard(value)} />
    </div>
  </FormSection>
);

const DeviceConnectionString = ({ label, deviceId, hostName, sharedAccessKey }) => (
  <DeviceDetail label={label} value={`HostName=${hostName};DeviceId=${deviceId};SharedAccessKey=${sharedAccessKey}`} />
);

const ProvisionedDevice = ({ device, t }) => {
  // When an error occurs, the device has no data... and so there is nothing to display here.
  if (isEmptyObject(device)) return null;

  const {
    id,
    ioTHubHostName: hostName,
    authentication: { primaryKey },
    authentication: { secondaryKey }
  } = device;

  return (
    <div>
      <DeviceDetail label={t('devices.flyouts.new.deviceId.label')} value={id} />
      <DeviceDetail label={t('devices.flyouts.new.authenticationKey.primaryKey')} value={primaryKey} />
      <DeviceDetail label={t('devices.flyouts.new.authenticationKey.secondaryKey')} value={secondaryKey} />
      <DeviceConnectionString label={t('devices.flyouts.new.authenticationKey.primaryKeyConnection')} deviceId={id} hostName={hostName} sharedAccessKey={primaryKey} />
      <DeviceConnectionString label={t('devices.flyouts.new.authenticationKey.secondaryKeyConnection')} deviceId={id} hostName={hostName} sharedAccessKey={secondaryKey} />
    </div>
  );
};

export class DeviceNew extends LinkedComponent {
  constructor(props) {
    super(props);
    this.state = {
      isPending: false,
      error: undefined,
      successCount: 0,
      changesApplied: false,
      summaryMessage: props.t('devices.flyouts.new.affected'),
      formData: {
        count: 1,
        deviceId: '',
        isGenerateId: DeviceIdTypeOptions.manual.value,
        isSimulated: DeviceTypeOptions.physical.value,
        deviceModel: undefined,
        authenticationType: AuthTypeOptions.symmetric.value,
        isGenerateKeys: AuthKeyTypeOptions.generate.value,
        primaryKey: undefined,
        secondaryKey: undefined
      },
      provisionedDevice: {}
    };

    // Linked components
    // TODO: Translate validation messages... hopefully, in a way that doesn't require every form to duplicate the same messages.
    this.formDataLink = this.linkTo('formData');

    this.deviceTypeLink = this.formDataLink.forkTo('isSimulated')
      .map(stringToBoolean);

    this.countLink = this.formDataLink.forkTo('count')
      .reject(nonInteger)
      .map(stringToInt)
      .check(Validator.notEmpty, 'Number of devices is required.')
      .check(num => num > 0, 'Number of devices must be greater than zero.');

    this.deviceIdLink = this.formDataLink.forkTo('deviceId');

    this.isGenerateIdLink = this.formDataLink.forkTo('isGenerateId')
      .map(stringToBoolean);

    this.deviceModelLink = this.formDataLink.forkTo('deviceModel');

    this.authenticationTypeLink = this.formDataLink.forkTo('authenticationType')
      .reject(nonInteger)
      .map(stringToInt);

    this.isGenerateKeysLink = this.formDataLink.forkTo('isGenerateKeys')
      .map(stringToBoolean);

    this.primaryKeyLink = this.formDataLink.forkTo('primaryKey');

    this.secondaryKeyLink = this.formDataLink.forkTo('secondaryKey');
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { t } = nextProps;
    const { formData, isPending, changesApplied, summaryMessage } = nextState;

    // When the device type is Physical, only allow 1 to be created
    if (formData.isSimulated === DeviceTypeOptions.physical.value && formData.count !== 1) {
      this.setState(update(nextState, {
        formData: { count: { $set: 1 } }
      }));
    }

    // When the authentication type is X.509, ensure keys to be entered manually
    if (formData.authenticationType === AuthTypeOptions.x509.value && formData.isGenerateKeys !== AuthKeyTypeOptions.manual.value) {
      this.setState(update(nextState, {
        formData: { isGenerateKeys: { $set: AuthKeyTypeOptions.manual.value } }
      }));
    }

    // Update the summary message
    if (isPending) {
      this.updateSummaryMessage(nextState, t('devices.flyouts.new.pending'));
    }
    else if (changesApplied) {
      this.updateSummaryMessage(nextState, t('devices.flyouts.new.applySuccess'));
    }
    else if (summaryMessage !== t('devices.flyouts.new.affected')) {
      this.updateSummaryMessage(nextState, t('devices.flyouts.new.affected'));
    }

    // Update normally
    return true;
  }

  updateSummaryMessage(nextState, message) {
    if (nextState.summaryMessage !== message) {
      this.setState(update(nextState, { summaryMessage: { $set: message } }));
    }
  }

  formIsValid() {
    //TODO: Implement validation.
    return [
      this.countLink,
      this.deviceIdLink,
      this.deviceTypeLink
    ].every(link => !link.error);
  }

  toRequestBody(formData) {
    const isX509 = formData.authenticationType === AuthTypeOptions.x509.value;
    const isGenerateKeys = this.isGenerateKeysLink.value === AuthKeyTypeOptions.generate.value;

    return {
      //Using Pascal Case names here because that is what the request to the server needs
      Id: formData.isGenerateId ? '' : formData.deviceId,
      IsSimulated: formData.isSimulated,
      Authentication:
        isGenerateKeys
          ? {}
          : {
            AuthenticationType: formData.authenticationType,
            PrimaryKey: isX509 ? null : formData.primaryKey,
            SecondaryKey: isX509 ? null : formData.secondaryKey,
            PrimaryThumbprint: isX509 ? formData.primaryKey : null,
            SecondaryThumbprint: isX509 ? formData.secondaryKey : null
          }
    };
  }

  apply = () => {
    this.setState({ isPending: true });

    this.subscription = IoTHubManagerService.provisionDevice(this.toRequestBody(this.state.formData))
      .subscribe(
        provisionedDevice => {
          this.setState({ provisionedDevice, successCount: this.state.formData.count, isPending: false, changesApplied: true });
          this.props.insertDevice(provisionedDevice);
        },
        errorResponse => {
          this.setState({ error: errorResponse.errorMessage, isPending: false, changesApplied: true });
        }
      );
  }

  render() {
    const { t, onClose } = this.props;
    const {
      formData,
      provisionedDevice,
      isPending,
      error,
      successCount,
      changesApplied,
      summaryMessage
    } = this.state;

    const isGenerateId = this.isGenerateIdLink.value === DeviceIdTypeOptions.generate.value;
    const deviceName = this.deviceModelLink.value || t('devices.flyouts.new.deviceIdExample.deviceName');
    const isSimulatedDevice = this.deviceTypeLink.value === DeviceTypeOptions.simulated.value;
    const isX509 = this.authenticationTypeLink.value === AuthTypeOptions.x509.value;
    const isGenerateKeys = this.isGenerateKeysLink.value === AuthKeyTypeOptions.generate.value;
    const summaryCount = changesApplied ? successCount : formData.count;
    const completedSuccessfully = changesApplied && successCount === formData.count;

    return (
      <Flyout>
        <FlyoutHeader>
          <FlyoutTitle>{t('devices.flyouts.new.title')}</FlyoutTitle>
          <FlyoutCloseBtn onClick={onClose} />
        </FlyoutHeader>
        <FlyoutContent>
          <form className="devices-new-container" onSubmit={this.apply}>
            <FormGroup>
              <FormLabel key={DeviceTypeOptions.labelName}>{t(DeviceTypeOptions.labelName)}</FormLabel>
              <Radio link={this.deviceTypeLink} key={DeviceTypeOptions.simulated.labelName} value={DeviceTypeOptions.simulated.value}>
                {t(DeviceTypeOptions.simulated.labelName)}
              </Radio>
              <Radio link={this.deviceTypeLink} key={DeviceTypeOptions.physical.labelName} value={DeviceTypeOptions.physical.value}>
                {t(DeviceTypeOptions.physical.labelName)}
              </Radio>
            </FormGroup>
              <FormGroup>
                <FormLabel key={DeviceTypeOptions.labelName}>{t(DeviceTypeOptions.labelName)}</FormLabel>
                <Radio link={this.deviceTypeLink} key={DeviceTypeOptions.simulated.labelName} value={DeviceTypeOptions.simulated.value}>
                  {t(DeviceTypeOptions.simulated.labelName)}
                </Radio>
                <Radio link={this.deviceTypeLink} key={DeviceTypeOptions.physical.labelName} value={DeviceTypeOptions.physical.value}>
                  {t(DeviceTypeOptions.physical.labelName)}
                </Radio>
              </FormGroup>

              {
                isSimulatedDevice && [
                  <FormGroup>
                    <FormLabel>{t('devices.flyouts.new.count.label')}</FormLabel>
                    <FormControl link={this.countLink} type="number" />
                  </FormGroup>,
                  <FormGroup>
                    <FormLabel>{t('devices.flyouts.new.deviceIdExample.label')}</FormLabel>
                    <div className="device-id-example">{t('devices.flyouts.new.deviceIdExample.format', { deviceName })}</div>
                  </FormGroup>,
                  <FormGroup>
                    <FormLabel>{t('devices.flyouts.new.deviceModel.label')}</FormLabel>
                    <div className="device-model-temp">{t('devices.flyouts.new.deviceModel.hint')} -- TODO: Add options</div>
                  </FormGroup>
                ]
              }
              {
                !isSimulatedDevice && [
                  <FormGroup>
                    <FormLabel>{t('devices.flyouts.new.count.label')}</FormLabel>
                    <div className="device-count">{this.countLink.value}</div>
                  </FormGroup>,
                  <FormGroup>
                    <FormLabel>{t('devices.flyouts.new.deviceId.label')}</FormLabel>
                    <Radio link={this.isGenerateIdLink} key={DeviceIdTypeOptions.manual.hintName} value={DeviceIdTypeOptions.manual.value}>
                      <FormControl className="device-id" link={this.deviceIdLink} disabled={isGenerateId} type="text" placeholder={t(DeviceIdTypeOptions.manual.hintName)} />
                    </Radio>
                    <Radio link={this.isGenerateIdLink} key={DeviceIdTypeOptions.generate.labelName} value={DeviceIdTypeOptions.generate.value}>
                      {t(DeviceIdTypeOptions.generate.labelName)}
                    </Radio>
                  </FormGroup>,
                  <FormGroup>
                    <FormLabel key={AuthTypeOptions.labelName}>{t(AuthTypeOptions.labelName)}</FormLabel>
                    <Radio link={this.authenticationTypeLink} key={AuthTypeOptions.symmetric.labelName} value={AuthTypeOptions.symmetric.value}>
                      {t(AuthTypeOptions.symmetric.labelName)}
                    </Radio>
                    <Radio link={this.authenticationTypeLink} key={AuthTypeOptions.x509.labelName} value={AuthTypeOptions.x509.value}>
                      {t(AuthTypeOptions.x509.labelName)}
                    </Radio>
                  </FormGroup>,
                  <FormGroup>
                    <FormLabel key={AuthKeyTypeOptions.labelName}>{t(AuthKeyTypeOptions.labelName)}</FormLabel>
                    <Radio link={this.isGenerateKeysLink} key={AuthKeyTypeOptions.generate.labelName} value={AuthKeyTypeOptions.generate.value} disabled={isX509}>
                      {t(AuthKeyTypeOptions.generate.labelName)}
                    </Radio>
                    <Radio link={this.isGenerateKeysLink} key={AuthKeyTypeOptions.manual.labelName} value={AuthKeyTypeOptions.manual.value}>
                      {t(AuthKeyTypeOptions.manual.labelName)}
                    </Radio>
                    <div className="sub-settings">
                      <FormLabel>{isX509 ? t('devices.flyouts.new.authenticationKey.primaryThumbprint') : t('devices.flyouts.new.authenticationKey.primaryKey')}</FormLabel>
                      <FormControl link={this.primaryKeyLink} disabled={isGenerateKeys} type="text" placeholder={t('devices.flyouts.new.authenticationKey.hint')} />
                      <FormLabel>{t(isX509 ? t('devices.flyouts.new.authenticationKey.secondaryThumbprint') : 'devices.flyouts.new.authenticationKey.secondaryKey')}</FormLabel>
                      <FormControl link={this.secondaryKeyLink} disabled={isGenerateKeys} type="text" placeholder={t('devices.flyouts.new.authenticationKey.hint')} />
                    </div>
                  </FormGroup>
                ]
              }
            <SummarySection title={t('devices.flyouts.new.summaryHeader')}>
              <SummaryCount>{summaryCount}</SummaryCount>
              <SectionDesc>{summaryMessage}</SectionDesc>
              {this.state.isPending && <Indicator />}
              {completedSuccessfully && <Svg className="summary-icon" path={svgs.apply} />}
            </SummarySection>

            {
              error &&
              <div className="devices-new-error">
                <ErrorMsg>{error}</ErrorMsg>
              </div>
            }
            {
              !changesApplied &&
              <BtnToolbar className="tools-preApply">
                {/* TODO: Temporarily disable the Apply button for simulated devices. That'll be implemented in another PR. */}
                <Btn svg={svgs.trash} primary={true} disabled={isPending || formData.count === 0 || isSimulatedDevice} onClick={this.apply}>{t('devices.flyouts.new.apply')}</Btn>
                <Btn svg={svgs.cancelX} onClick={onClose}>{t('devices.flyouts.new.cancel')}</Btn>
              </BtnToolbar>
            }
            {
              !!changesApplied &&
              <div>
                <ProvisionedDevice device={provisionedDevice} t={t} />

                <BtnToolbar className="tools-postApply">
                  <Btn svg={svgs.cancelX} onClick={onClose}>{t('devices.flyouts.new.close')}</Btn>
                </BtnToolbar>
              </div>
            }
          </form>
        </FlyoutContent>
      </Flyout >
    );
  }
}
