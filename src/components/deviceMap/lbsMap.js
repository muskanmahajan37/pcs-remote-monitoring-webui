import React, { Component } from 'react';
import { connect } from 'react-redux';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import 'mapbox-gl/dist/mapbox-gl.css';
import EventTopic, { Topics } from '../../common/eventtopic';
import { bindActionCreators } from 'redux';
import * as actions from '../../actions';

import './deviceMap.css';

class LbsMap extends Component {
  constructor(props) {
    super(props);
    this.map = null;
    this.state = {}
  }

  componentWillReceiveProps(nextProps) {
    if (this.map) {
      const source = this.map.getSource("earthquakes");
      if (source) {
        source.setData(nextProps.geoJson);
      }
    }
  }

  componentDidMount() {
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';
    const map = this.map =  new mapboxgl.Map({
      container: 'lbsMapElId',
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [ -120.740135, 47.751076 ],
      zoom: 5,
      scrollZoom: true,
      doubleClickZoom: true
    });

    map.addControl(new mapboxgl.NavigationControl());

    map.on('load', () => {
        map.addSource("earthquakes", {
            type: "geojson",
            data: this.props.geoJson,
            cluster: true,
            clusterMaxZoom: 40, // Max zoom to cluster points on
            clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
        });

        map.addLayer({
            id: "clusters",
            type: "circle",
            source: "earthquakes",
            filter: ["has", "point_count"],
            paint: {
                "circle-color": {
                    property: "point_count",
                    type: "interval",
                    stops: [
                        [0, "white"],
                        [10, "white"],
                        [50, "#c2d6d6"]
                    ]
                },
                "circle-radius": {
                    property: "point_count",
                    type: "interval",
                    stops: [
                        [0, 20],
                        [100, 30],
                        [750, 40]
                    ]
                }
            }
        });

        map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "earthquakes",
            filter: ["has", "point_count"],
            layout: {
                "text-field": "{point_count_abbreviated}",
                "text-size": 12
            }
        });

        map.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: "earthquakes",
            filter: ["!has", "point_count"],
            paint: {
              "circle-color": "#11b4da",
              "circle-radius": 7,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#fff"
            }
        });
    });

    map.on('click', 'unclustered-point', function (e) {
       new mapboxgl.Popup()
         .setLngLat(e.features[0].geometry.coordinates)
         .setHTML(e.features[0].properties.description)
         .addTo(map);
    });

     // Change the cursor to a pointer when the mouse is over the unclustered-point layer.
     map.on('mouseenter', 'unclustered-point', function () {
         map.getCanvas().style.cursor = 'pointer';
     });

     // Change it back to a pointer when it leaves.
     map.on('mouseleave', 'unclustered-point', function () {
         map.getCanvas().style.cursor = 'pointer';
     });

     let devices = this.props.devices;
     let actions = this.props.actions;

     // Flyout appeares when we click on default (final) pushpin.
     map.on('click', 'unclustered-point', function (e) {
       setTimeout(() => {
         let device = devices.items.filter(item => {
            return item.Id === e.features[0].properties.description;
         });
         const flyoutConfig = { device : device[0], type: 'Device detail' };
         actions.showFlyout({ ...flyoutConfig });
         EventTopic.publish(Topics.device.selected, device[0]);
       });
     });
  }

  render() {
    return <div id='lbsMapElId'></div>
  }
}

const mapStateToProps = state => {
  return {
    devices: state.deviceReducer.devices,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    actions: bindActionCreators(actions, dispatch)
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(LbsMap);
