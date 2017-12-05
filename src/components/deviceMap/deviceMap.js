// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as actions from '../../actions';
import LbsMap from './lbsMap';
import RegionDetails from '../../components/deviceMap/regionDetails.js';
import { Row, Col } from 'react-bootstrap';
import StaticMapWithOutDevices from '../../assets/icons/staticMapWithOutDevices.png';
import lang from '../../common/lang';
import config from '../../common/config';
import DashboardPanel from '../dashboardPanel/dashboardPanel';
import './deviceMap.css';

class DeviceMap extends Component {
  constructor(props) {
    super(props);
    this.state = { geoJson: null };
  }

  // componentDidMount() {
  //   this.addScript(this.props);
  // }
  //
  // addScript(nextProps) {
  //   if (!this.createdScript && nextProps.BingMapKey && nextProps.BingMapKey !== config.STATUS_CODES.STATIC) {
  //     this.createdScript = true;
  //     this.createScript( 'https://www.bing.com/api/maps/mapcontrol?callback=loadMap' );
  //   }
  // }
  //

  componentWillReceiveProps(nextProps) {
    this.applyPropsToState(nextProps);
  }

  componentWillMount() {
    this.applyPropsToState(this.props);
  }

  applyPropsToState(props) {
    const {devices, telemetryByDeviceGroup, alarmList, BingMapKey} = props;
    if (!devices || !telemetryByDeviceGroup || !alarmList) return;  //the data is not loaded yet, return
    const geoJson = {type: "FeatureCollection", features: []};
      //If control reaches here, that means map is loaded and also the data is also loaded.
    geoJson.features = devices.items.map(device => {
      let latitude, longitude, severity;
      telemetryByDeviceGroup.Items.some(telemetryGroup => {
        /**
        Bing Map renders the devices only if the devices have longitude and latitude.
        If not we are not showing the devices on Map (all devices don't have the longitude and latitude).
        */
        if (device.Id === telemetryGroup.DeviceId) {
          if (
            telemetryGroup.Data &&
            telemetryGroup.Data.latitude &&
            telemetryGroup.Data.longitude
          ) {
            latitude = telemetryGroup.Data.latitude;
            longitude = telemetryGroup.Data.longitude;
          } else if (device.Properties.Reported) {
            latitude = device.Properties.Reported.Latitude;
            longitude = device.Properties.Reported.Longitude;
          }
          return true; //stop looping
        }
      });
      alarmList.some(alarm => {
        if (device.Id === alarm.DeviceId) {
          severity = alarm.Rule.Severity;
        }
        return true; //stop looping
      });
      return {
        "type": "Feature",
         "properties": {
           severity: severity
         },
         "geometry": {
             "type": "Point",
             "coordinates": [longitude, latitude ]
         }
      };
    });
    this.setState({ geoJson : geoJson });
  }

  // showMap(props) {
  //   this.setState({ mapCallbackComplete: true });
  //   const { devices, telemetryByDeviceGroup, alarmList, actions } = props;
  //
  //   if (!devices || !telemetryByDeviceGroup || !alarmList)  return;
  //
  //   //If control reaches here, that means map is loaded and also the data is also loaded.
  //   devices.items.forEach(device => {
  //     telemetryByDeviceGroup.Items.forEach(telemetryGroup => {
  //       /**
  //       Bing Map renders the devices only if the devices have longitude and latitude.
  //       If not we are not showing the devices on Map (all devices don't have the longitude and latitude).
  //       */
  //       if (device.Id === telemetryGroup.DeviceId) {
  //         if (
  //           telemetryGroup.Data &&
  //           telemetryGroup.Data.latitude &&
  //           telemetryGroup.Data.longitude
  //         ) {
  //           device.latitude = telemetryGroup.Data.latitude;
  //           device.longitude = telemetryGroup.Data.longitude;
  //         } else if (device.Properties.Reported) {
  //           device.latitude = device.Properties.Reported.Latitude;
  //           device.longitude = device.Properties.Reported.Longitude;
  //         }
  //       }
  //     });
  //
  //     alarmList.forEach(alarm => {
  //       if (device.Id === alarm.DeviceId) {
  //         device.Severity = alarm.Rule.Severity;
  //       }
  //     });
  //   });
  //   MapPane.setData({
  //     BingMapKey: props.BingMapKey,
  //     deviceData: devices.items,
  //     container: this,
  //     actions
  //   });
  //   let data = this.getDeviceData(devices.items);
  //   MapPane.setDeviceLocationData(
  //     data.minLat,
  //     data.minLong,
  //     data.maxLat,
  //     data.maxLong,
  //     data.locationList
  //   );
  // }
  //
  // getDeviceData(data) {
  //   let Location = function(deviceId) {
  //     this.deviceId = deviceId;
  //     this.latitude = null;
  //     this.longitude = null;
  //     this.status = null;
  //     this.Severity = null;
  //   };
  //   let minLat;
  //   let maxLat;
  //   let minLong;
  //   let maxLong;
  //   let offset = 0.05;
  //   let mapData = {};
  //   let longitudes = [];
  //   let latitudes = [];
  //   let locationList;
  //   if (data && data.length) {
  //     locationList = data.map(function(item, i) {
  //       let location = new Location(item.Id);
  //       if (item.Id.match(/10_/)) {
  //         location.status = 1;
  //       } else if (item.Id.match(/6_/)) {
  //         location.status = 2;
  //       } else {
  //         location.status = 0;
  //       }
  //
  //       location.Severity = item.Severity;
  //       let latitude = (location.latitude = item.latitude);
  //       let longitude = (location.longitude = item.longitude);
  //       latitudes.push(Number(latitude));
  //       longitudes.push(Number(longitude));
  //
  //       return location;
  //     });
  //   }
  //   minLat = Math.min.apply(null, latitudes.filter(e => !isNaN(e)));
  //   maxLat = Math.max.apply(null, latitudes.filter(e => !isNaN(e)));
  //   minLong = Math.min.apply(null, longitudes.filter(e => !isNaN(e)));
  //   maxLong = Math.max.apply(null, longitudes.filter(e => !isNaN(e)));
  //
  //   // TODO: check mark validate data after API integration
  //   if (locationList && locationList.Count === 0) {
  //     minLat = 47.6;
  //     maxLat = 47.6;
  //     minLong = -122.3;
  //     maxLong = -122.3;
  //   }
  //   mapData.minLat = minLat - offset;
  //   mapData.maxLat = maxLat + offset;
  //   mapData.minLong = minLong - offset;
  //   mapData.maxLong = maxLong + offset;
  //   mapData.locationList = locationList;
  //   return mapData;
  // }
  //
  // createScript(src) {
  //   return new Promise((resolve, reject) => {
  //     let script = document.createElement('script');
  //     script.src = src;
  //     script.addEventListener('load', function() {
  //       resolve();
  //     });
  //     script.addEventListener('error', function(e) {
  //       reject(e);
  //     });
  //     document.body.appendChild(script);
  //   });
  // }
  //
  // renderStaticMap() {
  //     return <div className="map-container">
  //       <div className="static-map-modal">
  //         <span className="static-text">
  //           {lang.MAP_MODAL_CONTENT}
  //           <a className="static-link" rel="noopener noreferrer" href="https://docs.microsoft.com/azure/iot-suite/iot-suite-faq" target='_blank'>{lang.MAP_MODAL_FAQS}</a>
  //         </span>
  //       </div>
  //       <img src={StaticMapWithOutDevices} alt="StaticMap" className="static-bing-map"/>
  //     </div>
  // }

  render() {
    return (
      <DashboardPanel title={lang.DEVICELOCATION}
        className="map-container">
        <Row>
          <RegionDetails {...this.props} />
          {
            this.state.geoJson !== null &&
            <Col md={9} className="bing-map">
              <LbsMap geoJson={this.state.geoJson} />
            </Col>
          }
        </Row>
      </DashboardPanel>
    );
  }
}

const mapStateToProps = state => {
  return {
    error: state.mapReducer.error || state.deviceReducer.error,
    showHeaderSpinner: state.indicatorReducer.kpi,
    showContentSpinner: state.indicatorReducer.kpiInitial,
    telemetryByDeviceGroup: state.deviceReducer.telemetryByDeviceGroup
  };
};

const mapDispatchToProps = dispatch => {
  return {
    actions: bindActionCreators(actions, dispatch)
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DeviceMap);
