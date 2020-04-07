# &#35;supportyourlocal

&#35;supportyourlocal is an initative to help support local businesses during the COVID-19 pandemic. By creating an easy way to find all of the shops that are offering gift cards and vouchers, people can support their favorite shops and restaurants by buying digitally when the businesses and workers need it most and consuming later when things open up again.

It is an open-source project as we are open to anyone who wants to contribute to help small businesses and workers during this time of need. You may also fork the project and use it as a starting point for your own map and database of shops in other parts of the world. As of right now, &#35;supportyourlocal only has places in Germany but is planning to expand.

If you would like to get involved, please contact us at hello@supportyourlocal.online

Live website - https://www.search.supportyourlocal.online/

## Table of Contents
  - [Contributing](#contributing)
    - [Getting Started](#gettingstarted)
    - [Adding In Test Data To Your Database](#addingintestdata)
    - [Creating Commits and Pulls Requests](#commitsandpullrequests)
  - [Our Technology Stack Hooks](#techstack)

<a name="contributing"/>

## Contributing

Please follow the guidelines below for getting started and making commits.

<a name="gettingstarted"/>

### Getting started

1. Download the repo to your machine
2. Run `npm install` in both the root directory AND `/client/` directory
3. Create a `.env` file in the root directory
4. In the `.env` file, add the variable `PORT=5050`
5. You will need to setup a MongoDB account at https://www.mongodb.com/ and create a new cluster for this project
6. Add in the following variables to `.env`, replacing `XXX` with your respective values from your MongoDB cluster:

   ```
   MONGO_URI=XXX
   MONGO_AUTH_SOURCE=XXX
   MONGO_DATABASE_NAME=XXX
   ```

7. In `/client/` create another `.env` file.
8. You will need to create a Mapbox account at https://www.mapbox.com/
9. Once you have your Mapbox account setup, in `/client/.env` add the following variable, replacing `XXX` with your Mapbpx API key:

   ```
   REACT_APP_MAPBOX_ACCESS_TOKEN=XXX
   ```

10. *Optional*: Create an account at https://www.geoplugin.com/ and obtain an API key. If you do not add this key, the initial geolocation of the user will fail and revert to the default set location. Add that API key like so, again replacing `XXX`:

   ```
   REACT_APP_GEO_PLUGIN_API_KEY=XXX
   ```

11. With your environment variables setup, naviagate to the root directory and run `npm run dev`. The project should be running at [http://localhost:3000/](http://localhost:3000/)

<a name="addingintestdata"/>

#### Adding In Test Data To Your Database

In order to properly work on this project, you will need some data to work with. Follow these steps to get setup with some test data to get started -

1. Once the app is running locally, navigate to [http://localhost:3000/firstvoucherdatadownload](http://localhost:3000/firstvoucherdatadownload)
2. A crude tool has been put together to easily import the data from [First Voucher](https://www.firstvoucher.com/)
3. Wait until the text that says **Submit data to database** appears and then click it
4. Wait a couple of minutes. A proper success screen has not been implemented for this tool, so let it run without clicking anything on the window.
5. The data should eventually show up on the page. If it does not, check the console for errors and/or try refreshing the page. An environment variable may be setup incorrectly.

<a name="commitsandpullrequests"/>

### Creating Commits and Pulls Requests

When contributing please follow the below rules:

- Always work off of feature branches that branch off from the `develop` branch
- Before committing your code, run `npm run lint:fix` to make sure your code is formatted to the same standards as the rest of the project
- Make pull-requests from your feature branch into the `develop` branch. Once your contribution has been tested in the staging environment (visible at https://supportyourlocal-dev.herokuapp.com/) we will merge it into the master/production.

<a name="techstack"/>

## Our Technology Stack

&#35;supportyourlocal uses the following primary technologies. Their respective documentation has been linked to for reference -

- [ReactJS](https://reactjs.org/docs/getting-started.html)
- [TypeScript](https://www.typescriptlang.org/docs/home.html)
- [NodeJS](https://nodejs.org/en/docs/)
- [MongoDB](https://docs.mongodb.com/manual/introduction/)
- [GraphQL](https://graphql.org/learn/)
- [Express](https://expressjs.com/)
- [Mapbox](https://docs.mapbox.com/mapbox-gl-js/api/)
