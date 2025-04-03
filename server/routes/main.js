const express = require('express');
const axios = require('axios');
const BABYNAMES = require('../../public/js/assets/names.js');
const { possibleDomains } = require('../../public/js/assets/urls.js');
const PARKED_KEYWORDS = require('../../public/js/assets/parked-keywords.js')
const REGISTRAR_DOMAINS = require('../../public/js/assets/registrar-domains.js')


const router = express.Router();

const isRegistrar = (url) => ( 
    REGISTRAR_DOMAINS.includes(new URL(url).hostname)
)

const parkedPatterns = PARKED_KEYWORDS.map(keyword => new RegExp(`${keyword}`, 'ui'));
const isParkedPage = (html) => {

  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  
  return parkedPatterns.some(regex => regex.test(text));
};

const urlExists = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      maxRedirects: 5,
      timeout: 5000
    });

    const finalUrl = response.request.res.responseUrl || url;
    if (isRegistrar(finalUrl)) return false;
    if (isParkedPage(response.data)) return false;

    return url;
  } catch (error) {
    return false;
  }
};

const getUrlList = (bride, groom) => (
  possibleDomains(bride,groom).flatMap(domain =>[
    `https://www.${domain}.com`,
    `http://www.${domain}.com` //http fallback
    ]
  )
);

const getExistingUrl = async (urlList) => {
  const promises = urlList.map(url => 
    urlExists(url).then(exists => exists ? url : Promise.reject())
  );

  return Promise.any(promises).catch(() => null);
};

const MAX_ATTEMPTS = 100;

const findWorkingCoupleSite = async (i = 0) => {
    const bride = BABYNAMES.girls[Math.floor(Math.random() * 100)];
    const groom = BABYNAMES.boys[Math.floor(Math.random() * 100)];
    const urlList = getUrlList(bride, groom);
    const validUrl = await getExistingUrl(urlList);

    if (i>=MAX_ATTEMPTS){
      throw new Error(`No site found after ${MAX_ATTEMPTS} attempts`);
    }
    return validUrl 
      ? { bride, groom, result: validUrl } 
      :     console.log(`💔 No luck with ${bride} and ${groom}`) || findWorkingCoupleSite( i+1 )
}

const getRandomCouple = () => {
  const bride = BABYNAMES.girls[Math.floor(Math.random() * 100)];
  const groom = BABYNAMES.boys[Math.floor(Math.random() * 100)];
  return { bride, groom };
};

router.get('/random', (req, res) => {
  const couple = getRandomCouple();
  res.json(couple);
});

router.get('/check', async (req, res) => {
  const { bride, groom } = req.query;
  if (!bride || !groom) {
    return res.status(400).json({ error: 'Missing bride or groom' });
  }
  if (!BABYNAMES.girls.includes(bride) || !BABYNAMES.boys.includes(groom)) {
    return res.status(400).json({ error: 'Invalid bride or groom name' });
  }
  const urlList = getUrlList(bride, groom);
  const result = await getExistingUrl(urlList);
  res.json({ result });
});

router.get('/check', async (req, res) => {
  try {
    const { bride, groom, result } = await findWorkingCoupleSite();
    res.json({ bride, groom, result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Error finding wedding site' });
  }
});

router.get('/testurl', async (req, res) => {
    const { url } = req.query;
    var exists = await urlExists(url)
    console.log(exists)

});

router.get('', (req, res) => {
  const { bride, groom } = getRandomCouple();
  res.render('index', {
    locals: { title: 'Wedding Checker' },
    bride,
    groom,
    result: null
  });
});

module.exports = router;