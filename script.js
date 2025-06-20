document.addEventListener('DOMContentLoaded', () => {
  let allClassics = [];
  let currentFilter = 'all';
  let currentLanguage = localStorage.getItem('language') || 'zh';
  let languageData = {};
  let isLoading = false;

  // Get all DOM elements
  const classicsContainer = document.getElementById('classics-grid');
  const galleryContainer = document.getElementById('gallery-carousel');
  const searchBox = document.getElementById('search-box');
  const filterButtonsContainer = document.getElementById('filter-buttons');
  const langBtn = document.getElementById('lang-btn');

  // If essential elements are missing, do nothing to prevent errors.
  if (!classicsContainer || !galleryContainer) {
    console.error('Essential containers not found. Aborting script.');
    showUserError('页面加载出错，请刷新重试 / Page loading error, please refresh');
    return;
  }

  // Show user-friendly error messages
  function showUserError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed; top: 20px; right: 20px; 
      background: #ff3b30; color: white; 
      padding: 1rem; border-radius: 8px; 
      z-index: 1000; max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  // Show loading state
  function showLoading(container, show = true) {
    if (show && !isLoading) {
      const loader = document.createElement('div');
      loader.id = 'loading-spinner';
      loader.style.cssText = `
        text-align: center; padding: 2rem; color: #666;
        font-size: 1.1rem;
      `;
      loader.innerHTML = '⏳ 加载中... / Loading...';
      container.appendChild(loader);
      isLoading = true;
    } else if (!show && isLoading) {
      const loader = document.getElementById('loading-spinner');
      if (loader) loader.remove();
      isLoading = false;
    }
  }

  // Safe DOM manipulation
  function createTextNode(text) {
    return document.createTextNode(text || '');
  }

  function handleImageError(img, fallbackSrc = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f0f0f0"/><text x="60" y="65" text-anchor="middle" fill="%23999" font-size="14">图片加载失败</text></svg>') {
    img.onerror = () => {
      img.src = fallbackSrc;
      img.onerror = null; // Prevent infinite loop
    };
  }

  // Language functions
  function updateLanguageButton() {
    if (langBtn) {
      const langText = langBtn.querySelector('.lang-text') || langBtn;
      // Show current language and what clicking will switch to
      if (currentLanguage === 'zh') {
        langText.textContent = 'EN';
        langBtn.setAttribute('title', 'Switch to English');
        langBtn.setAttribute('aria-label', 'Switch to English');
      } else {
        langText.textContent = '中文';
        langBtn.setAttribute('title', 'Switch to Chinese');
        langBtn.setAttribute('aria-label', 'Switch to Chinese');
      }
    }
  }

  function getNestedProperty(obj, path) {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  function updatePageLanguage() {
    const currentLangData = languageData[currentLanguage];
    if (!currentLangData) return;

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const text = getNestedProperty(currentLangData, key);
      if (text) {
        element.textContent = text;
      }
    });

    // Update placeholder text
    document.querySelectorAll('[data-placeholder-i18n]').forEach(element => {
      const key = element.getAttribute('data-placeholder-i18n');
      const text = getNestedProperty(currentLangData, key);
      if (text) {
        element.placeholder = text;
      }
    });

    // Update culture content
    const cultureContent = document.getElementById('culture-content');
    if (cultureContent && currentLangData.culture.content) {
      cultureContent.innerHTML = '';
      currentLangData.culture.content.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        cultureContent.appendChild(p);
      });
    }

    // Update materials list
    const materialsList = document.getElementById('materials-list');
    if (materialsList && currentLangData.basics.materials) {
      materialsList.innerHTML = '';
      currentLangData.basics.materials.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        materialsList.appendChild(li);
      });
    }

    // Update techniques list
    const techniquesList = document.getElementById('techniques-list');
    if (techniquesList && currentLangData.basics.techniques) {
      techniquesList.innerHTML = '';
      currentLangData.basics.techniques.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        techniquesList.appendChild(li);
      });
    }

    // Update tips list
    const tipsList = document.getElementById('tips-list');
    if (tipsList && currentLangData.tips.content) {
      tipsList.innerHTML = '';
      currentLangData.tips.content.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        tipsList.appendChild(li);
      });
    }

    // Update spirits names using data-spirit attribute
    const spiritNames = {
      zh: { vodka: '伏特加', gin: '金酒', rum: '朗姆酒', tequila: '龙舌兰', whiskey: '威士忌', brandy: '白兰地' },
      en: { vodka: 'Vodka', gin: 'Gin', rum: 'Rum', tequila: 'Tequila', whiskey: 'Whiskey', brandy: 'Brandy' }
    };
    
    document.querySelectorAll('[data-spirit]').forEach(element => {
      const spiritKey = element.getAttribute('data-spirit');
      if (spiritNames[currentLanguage] && spiritNames[currentLanguage][spiritKey]) {
        element.textContent = spiritNames[currentLanguage][spiritKey];
      }
    });

    // Re-render cocktails to update language
    updateDisplay();

    // Update document language attribute
    document.documentElement.lang = currentLanguage;
  }

  function renderClassics(cocktails) {
    showLoading(classicsContainer);
    classicsContainer.innerHTML = '';
    
    if (cocktails.length === 0) {
      const noResults = document.createElement('div');
      noResults.style.cssText = 'text-align: center; padding: 2rem; color: #666;';
      noResults.textContent = currentLanguage === 'zh' ? '没有找到相关鸡尾酒' : 'No cocktails found';
      classicsContainer.appendChild(noResults);
      showLoading(classicsContainer, false);
      return;
    }

    cocktails.forEach(cocktail => {
      const item = document.createElement('div');
      item.className = 'grid-item';
      
      // Create image element safely with lazy loading
      const img = document.createElement('img');
      img.src = cocktail.image;
      img.alt = cocktail.name;
      img.loading = 'lazy';
      handleImageError(img);
      
      // Create name element
      const nameElement = document.createElement('strong');
      nameElement.textContent = cocktail.name;
      
      // Create description element
      const descElement = document.createElement('p');
      let description;
      if (typeof cocktail.description === 'object' && cocktail.description !== null) {
        description = cocktail.description[currentLanguage] || cocktail.description.zh || cocktail.description.en || '';
      } else {
        description = cocktail.description || '';
      }
      descElement.textContent = description;
      
      // Append elements safely
      item.appendChild(img);
      item.appendChild(nameElement);
      item.appendChild(descElement);
      classicsContainer.appendChild(item);
    });
    
    showLoading(classicsContainer, false);
  }

  function renderGallery(creations) {
    showLoading(galleryContainer);
    galleryContainer.innerHTML = '';
    
    creations.forEach(creation => {
      const item = document.createElement('div');
      item.className = 'carousel-item';
      
      // Create image element safely with lazy loading
      const img = document.createElement('img');
      img.src = creation.image;
      img.loading = 'lazy';
      handleImageError(img);
      
      // Create name element
      const nameContainer = document.createElement('p');
      const nameElement = document.createElement('strong');
      
      let name;
      if (typeof creation.name === 'object' && creation.name !== null) {
        name = creation.name[currentLanguage] || creation.name.zh || creation.name.en || '';
      } else {
        name = creation.name || '';
      }
      nameElement.textContent = name;
      img.alt = name;
      
      nameContainer.appendChild(nameElement);
      item.appendChild(img);
      item.appendChild(nameContainer);
      galleryContainer.appendChild(item);
    });
    
    showLoading(galleryContainer, false);
  }

  function updateDisplay() {
    // Get search term safely, defaulting to empty string if search box doesn't exist.
    const searchTerm = searchBox ? searchBox.value.trim().toLowerCase() : '';

    const filteredCocktails = allClassics.filter(cocktail => {
      // Condition 1: Does it match the base spirit filter?
      const matchesFilter = currentFilter === 'all' || cocktail.base === currentFilter;
      
      // Condition 2: Does it match the search term? (Enhanced to support Chinese)
      let matchesSearch = !searchTerm;
      if (searchTerm) {
        const nameMatch = cocktail.name.toLowerCase().includes(searchTerm);
        let descMatch = false;
        
        if (typeof cocktail.description === 'object' && cocktail.description !== null) {
          const zhDesc = (cocktail.description.zh || '').toLowerCase();
          const enDesc = (cocktail.description.en || '').toLowerCase();
          descMatch = zhDesc.includes(searchTerm) || enDesc.includes(searchTerm);
        } else {
          descMatch = (cocktail.description || '').toLowerCase().includes(searchTerm);
        }
        
        matchesSearch = nameMatch || descMatch;
      }

      return matchesFilter && matchesSearch;
    });

    renderClassics(filteredCocktails);
  }

  // Load languages and cocktails data with better error handling
  showLoading(classicsContainer);
  Promise.all([
    fetch('languages.json')
      .then(response => {
        if (!response.ok) throw new Error(`Languages file error: ${response.status}`);
        return response.json();
      }),
    fetch('cocktails.json')
      .then(response => {
        if (!response.ok) throw new Error(`Cocktails file error: ${response.status}`);
        return response.json();
      })
  ])
  .then(([langData, cocktailData]) => {
    languageData = langData;
    allClassics = cocktailData.classics || [];
    
    // Initialize language
    updateLanguageButton();
    updatePageLanguage();
    
    // Render gallery
    renderGallery(cocktailData.myCreations || []);
  })
  .catch(error => {
    console.error('Error loading data:', error);
    showUserError('数据加载失败，请检查网络连接 / Data loading failed, please check network');
    showLoading(classicsContainer, false);
    
    // Try to load at least cocktails data as fallback
    fetch('cocktails.json')
      .then(response => {
        if (!response.ok) throw new Error(`Cocktails fallback error: ${response.status}`);
        return response.json();
      })
      .then(data => {
        allClassics = data.classics || [];
        updateDisplay();
        renderGallery(data.myCreations || []);
      })
      .catch(err => {
        console.error('Error loading cocktails fallback:', err);
        showUserError('无法加载内容 / Cannot load content');
      });
  });

  // Language toggle event listener
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
      localStorage.setItem('language', currentLanguage);
      updateLanguageButton();
      updatePageLanguage();
    });
  }

  // Add event listeners only if the elements exist
  if (searchBox) {
    searchBox.addEventListener('input', updateDisplay);
  }

  if (filterButtonsContainer) {
    filterButtonsContainer.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        const currentActive = filterButtonsContainer.querySelector('.filter-btn.active');
        if (currentActive) {
            currentActive.classList.remove('active');
        }
        e.target.classList.add('active');
        currentFilter = e.target.dataset.base;
        updateDisplay();
      }
    });
  }
});
