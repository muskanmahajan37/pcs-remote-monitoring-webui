// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';

// App Components
import Header from './header/header';
import Navigation from './navigation/navigation';
import Main from './main/main';
import PageContent from './pageContent/pageContent';

// Page Components
import  {
  DashboardContainer as DashboardPage,
  DevicesContainer as DevicesPage,
  RulesContainer as RulesPage,
  MaintenanceContainer as MaintenancePage,
  PageNotFound
} from 'components/pages';

import './app.css';

/** The base component for the app */
class App extends Component {

  componentDidMount() {
    const { history, registerRouteEvent } = this.props;
    // Initialize listener to inject the route change event into the epic action stream
    history.listen(({ pathname }) => registerRouteEvent(pathname));
  }

  render() {
    return (
      <div className="app">
        <Navigation />
        <Main>
          <Header logout={this.props.logout} t={this.props.t} />
          <PageContent>
            <Switch>
              <Redirect exact from="/" to="/dashboard" />
              <Route exact path="/dashboard" component={DashboardPage} />
              <Route exact path="/devices" component={DevicesPage} />
              <Route exact path="/rules" component={RulesPage} />
              <Route exact path="/maintenance" component={MaintenancePage} />
              <Route component={PageNotFound} />
            </Switch>
          </PageContent>
        </Main>
      </div>
    );
  }

}

export default App;
