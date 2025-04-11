// https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
const capitalizeFirstLetter = s =>(
  String(s).charAt(0).toUpperCase() + String(s).slice(1)
)

document.addEventListener('DOMContentLoaded', () => {
  const headerText = document.getElementById('header-text')
  const brideEl = document.getElementById('bride');
  const groomEl = document.getElementById('groom');
  const statusEl = document.getElementById('status');
  const resultContainer = document.getElementById('resultContainer');
  const actionButton = document.getElementById('actionButton');
  const loadingIndicator = document.getElementById('loadingIndicator');


  const fetchNewCouple = async () => {
    try {
      const response = await fetch('/random');
      const data = await response.json();
      brideEl.textContent = data.bride;
      groomEl.textContent = data.groom;
      statusEl.textContent = 'Click below to find out!';
      resultContainer.innerHTML = '';
      actionButton.textContent = '✨ Find A Wedding Website ✨';
    } catch (error) {
      statusEl.textContent = `Error fetching new couple.${error}`;
    }
  }

  const showNoMatchAlert = m => {
    const alertElem = document.createElement('div');
    alertElem.className = 'alert';
    alertElem.textContent = m;
  
    const x = Math.random() * (window.innerWidth - 200);
    const y = window.innerHeight * 0.6 + Math.random() * (window.innerHeight * 0.4 - 100);
  
    Object.assign(alertElem.style, {
      position: 'fixed',
      zIndex: 3000,
      left: `${x}px`,
      top: `${y}px`
    });
  
    document.body.appendChild(alertElem);
    setTimeout(() => alertElem.classList.add('hidden'), 4000);
    setTimeout(() => alertElem.remove(), 6000);
  };
  


  const checkWebsite = async () =>{
    const bride = brideEl.textContent;
    const groom = groomEl.textContent;


    statusEl.textContent = `Searching for ${bride} and ${groom}...`;
    actionButton.disabled = true;
    headerText.style.display = 'block'; 
    statusEl.style['font-size']= '1.2em'
    statusEl.style['font-weight']= ''
    loadingIndicator.style.display = 'block';

    try {
      const response = await fetch(`/check?bride=${encodeURIComponent(bride)}&groom=${encodeURIComponent(groom)}`);
      const data = await response.json();

      if (data.result) {
        const url = new URL(data.result);
        const hostname = url.hostname;
        const pathname = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
        resultContainer.innerHTML = `<a href="${data.result}" target="_blank" rel="noopener noreferrer">${hostname + pathname}</a>`;
        statusEl.textContent = `${capitalizeFirstLetter(bride)} and ${capitalizeFirstLetter(groom)} are getting married!`;
        headerText.style.display = 'none';
        statusEl.style['font-size']= '1.5em'
        statusEl.style['font-weight']= 'bold'
        actionButton.textContent = '✨ Try Another Couple ✨';
        actionButton.disabled = false;
        loadingIndicator.style.display = 'none';
      } else {
        showNoMatchAlert(`${bride} and ${groom} are not getting married :(`);
        fetchNewCouple().then(() => checkWebsite());
      }
    } catch (error) {
      statusEl.textContent = 'Error checking website.';
      actionButton.textContent = '✨ Try Again ✨';
      actionButton.disabled = false;
      loadingIndicator.style.display = 'none';
    }
  }

  actionButton.addEventListener('click', async () => {
    if(actionButton.textContent ===  '✨ Try Another Couple ✨'){
      fetchNewCouple().then(() => checkWebsite());
    }
    else{
      checkWebsite();
    }
  });
  fetchNewCouple();
});

window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.parentNode.removeChild(loadingScreen);
    }, 1000); 
  }
});

const toggleRespose = id => {
  const response = document.getElementById(id);
  if (response.style.display === "none") {
    response.style.display = "block";
  } else {
    response.style.display = "none";
  }
}
const hideResponse = id => ( document.getElementById(id).style.display = "none" )

document.getElementById('whoLink').addEventListener('click', () => {
  toggleRespose("whoMadeResponse")
  hideResponse('whyResponse')
  })

document.getElementById('whyLink').addEventListener('click', () => {
  toggleRespose("whyResponse")
  hideResponse('whoMadeResponse')
})
