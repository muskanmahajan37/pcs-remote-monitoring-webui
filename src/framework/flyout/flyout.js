// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Glyphicon } from 'react-bootstrap';

import './flyout.css';

export default class flyout extends Component {
    constructor(props) {
        super(props)
        this.state = this.getInitialState();
    }

    getInitialState() {
        const position = this.props.position || "right";
        const autoDismiss = this.props.autoDismiss === false ? false : true; 
        const width = this.props.width || 400;
        const state = {
            position: position,
            autoDismiss: autoDismiss,
            showCloseButton: this.props.showCloseButton,
            style: {
                width: width,
                transitionProperty: position,
                display: 'none'
            }
        };

        state.style[position] = width * -1;

        return state;
    }

    show() {
        const state = this.state;
        state.style.display = 'block';
        state.style[this.state.position] = 0;
        this.setState(state);
        document.addEventListener("click", this.handleClick);
    }

    hide() {
        document.removeEventListener("click", this.handleClick);
        this.setState(this.getInitialState());
    }

    handleClick = (e) => {
        const dom = ReactDOM.findDOMNode(this.refs.component);
        if (this.state.autoDismiss && !dom.contains(e.target)) {
            this.hide();
            e.preventDefault();
        }
    }

    handleCloseClick = (e) => {
        this.hide();
    }

    render() {
        return (
            <Wrapper>
                <div ref='component' className="flyout-panel" style={this.state.style} >
                    { this.state.showCloseButton && 
                        <span className="flyout-closebtn" onClick={this.handleCloseClick} ><Glyphicon glyph="remove" /></span>
                    }
                    <div className="flyout-panel-inner" >
                        {this.props.children}
                    </div>
                </div>
            </Wrapper>
        );
    }
}

class Wrapper extends Component {
    componentDidMount() {
        this.container = document.createElement('div');
        document.body.appendChild(this.container);
        this.renderChildren();
    }

    componentDidUpdate() {
        this.renderChildren();
    }

    componentWillUnmount() {
        ReactDOM.unmountComponentAtNode(this.container);
        document.body.removeChild(this.container);
    }

    renderChildren() {
        ReactDOM.render(
            this.props.children,
            this.container);
    }

    render() {
        return null;
    }
}

export class Header extends Component {
    render() {
        return (
            <div className="flyout-panel-header">{this.props.children}</div>
        );
    }
}

export class Body extends Component {
    render() {
        return (
            <div className="flyout-panel-body">{this.props.children}</div>
        );
    }
}

export class Footer extends Component {
    render() {
        return (
            <div className="flyout-panel-footer">{this.props.children}</div>
        );
    }
}