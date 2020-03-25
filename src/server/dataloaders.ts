// Modified from https://sayasuhendra.github.io/graphql-js/7-using-data-loaders/
// Fixed incorrect IDS with https://github.com/graphql/dataloader/issues/65
// import DataLoader from 'dataloader';

// export default () => ({
//   defaultLoader: new DataLoader(
//     async keys => Promise.all(
//       keys.map(key => State.findOne({_id: key})),
//     ),
//     {cacheKeyFn: (key: any) => key.toString()},
//   ),
// });

export default () => {return};