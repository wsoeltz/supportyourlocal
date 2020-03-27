import { ApolloProvider } from '@apollo/react-hooks';
import ApolloClient from 'apollo-boost';
import axios from 'axios';
import debounce from 'lodash/debounce';
import noop from 'lodash/noop';
import React, {
  createContext,
  lazy,
  Suspense,
  useEffect,
  useState,
} from 'react';
import Helmet from 'react-helmet';
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom';
import Loading from './components/general/Loading';
import { Routes } from './routing/routes';
import './styling/fonts/fonts.css';
import GlobalStyles from './styling/GlobalStyles';
import { Root } from './styling/Grid';

const LandingPage = lazy(() => import('./pages/landingPage'));
const FirstVoucherDataDownload = lazy(() => import('./pages/tools/FirstVoucherDataDownload'));
const PageNotFound = lazy(() => import('./pages/pageNotFound'));

const client = new ApolloClient();

interface UsersLocation {
  latitude: number;
  longitude: number;
  country2LetterCode: string;
}

export interface IAppContext {
  windowWidth: number;
  userLocation: UsersLocation | null | undefined;
  setUserLocation: (value: UsersLocation | null | undefined) => void;
}

export const AppContext = createContext<IAppContext>({
  windowWidth: window.innerWidth,
  userLocation: undefined,
  setUserLocation: noop,
});

function App() {

  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [userLocation, setUserLocation] = useState<UsersLocation | null | undefined>(undefined);

  const appContext = {windowWidth, userLocation, setUserLocation};

  useEffect(() => {
    const updateWindowWidth = debounce(() => {
      setWindowWidth(window.innerWidth);
    }, 500);
    window.addEventListener('resize', updateWindowWidth);
    return () => {
      window.removeEventListener('resize', updateWindowWidth);
    };
  }, []);

  useEffect(() => {
    const getUsersIpLocation = async () => {
      try {
        const key = process.env.REACT_APP_GEO_PLUGIN_API_KEY;
        const res = await axios.get(
          `https://ssl.geoplugin.net/json.gp?k=${key}`,
        );
        if (res && res.data &&
            res.data.geoplugin_latitude &&
            res.data.geoplugin_longitude &&
            res.data.geoplugin_countryCode
          ) {
          setUserLocation({
            longitude: parseFloat(res.data.geoplugin_longitude),
            latitude: parseFloat(res.data.geoplugin_latitude),
            country2LetterCode: res.data.geoplugin_countryCode,
          });
        } else {
          setUserLocation(null);
        }
      } catch (e) {
        setUserLocation(null);
        console.error(e);
      }
    };
    getUsersIpLocation();
  }, [setUserLocation]);

  const defaultMetaTitle = '#supportyourlocal';
  const defaultMetaDescription = 'Support your local businesses during the COVID-19 pandemic';

  // REMOVE THIS ONCE WE MOVE TO AWS
  const basename = window.location.host === 'cid-harvard.github.io'
    ? '/country-tools-front-end' : undefined;

  return (
    <>
      <AppContext.Provider value={appContext}>
        <ApolloProvider client={client}>
          <Helmet>
            {/* Set default meta data values */}
            <title>{defaultMetaTitle}</title>
            <meta name='description' content={defaultMetaDescription} />
            <meta property='og:title' content={defaultMetaTitle} />
            <meta property='og:description' content={defaultMetaDescription} />
          </Helmet>
          <Router basename={basename}>
            <Root>
              <GlobalStyles />
              <Suspense fallback={<Loading />}>
                <Switch>
                  <Route exact path={Routes.Landing}
                    render={(props: any) => <LandingPage {...props} />}
                  />
                  <Route exact path={Routes.FirstVoucherDataDownload}
                    render={(props: any) => <FirstVoucherDataDownload {...props} />}
                  />
                  {/* If none of the above routes are found show the 404 page */}
                  <Route component={PageNotFound} />
                </Switch>
              </Suspense>
            </Root>
          </Router>
        </ApolloProvider>
      </AppContext.Provider>
    </>
  );
}

export default App;
