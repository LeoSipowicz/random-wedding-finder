const express = require('express');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const expressLayouts = require('express-ejs-layouts');

const app = express();

//security
app.use(express.json({ limit: '1mb' }));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'","cdn.skypack.dev","pixijs.download","'unsafe-eval'"],
        "worker-src": ["'self'","blob:"],
        "connect-src": ["'self'","data:"],
        "img-src": ["'self'", "data:"],
      },
    },
  })
);

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per 5 minutes
  message: { error: "Too many requests, please try again later." },
  headers: true,
  keyGenerator: function (req) {
    return req.headers["x-forwarded-for"] || req.connection.remoteAddress; 
}
});

app.use(limiter);

const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.use('/', require('./server/routes/main.js'));


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });