// Dashboard Educacional – Cadastro de Ideias
// Versão corrigida e otimizada para integração com Google Apps Script

class ProjectDashboard {
  constructor() {
    // Substitua pela URL do seu Apps Script implantado
    this.scriptUrl = 'https://script.google.com/macros/s/AKfycbzgKVPw1NVmv1R6UH_PANHVs82BcSHJPiXbsfx8BV0/dev';
    this.form = document.getElementById('projectForm');
    this.submitButton = document.getElementById('submitButton');
    this.clearButton = document.getElementById('clearButton');
    this.successMessage = document.getElementById('successMessage');
    this.errorMessage = document.getElementById('errorMessage');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupCharacterCounter();
    this.setupFormValidation();
    this.addAnimationClasses();
  }

  setupEventListeners() {
    // Submissão do formulário
    this.form.addEventListener('submit', e => this.handleSubmit(e));
    // Limpar formulário
    this.clearButton.addEventListener('click', () => this.clearForm());
    // Validação em tempo real
    const inputs = this.form.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });
    // Auto-hide mensagens
    this.setupAutoHideMessages();
  }

  setupCharacterCounter() {
    const textarea = document.getElementById('projectDescription');
    const charCount = document.getElementById('charCount');
    if (!textarea || !charCount) return;
    textarea.addEventListener('input', () => {
      const count = textarea.value.length;
      charCount.textContent = count;
      if (count > 1000) charCount.style.color = '#ef4444';
      else if (count > 800) charCount.style.color = '#f59e0b';
      else charCount.style.color = '#64748b';
    });
  }

  setupFormValidation() {
    const inputs = this.form.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        if (input.value.trim() && input.checkValidity()) {
          input.classList.remove('error');
          input.classList.add('success');
        } else {
          input.classList.remove('success');
        }
      });
    });
  }

  validateField(field) {
    const errorDiv = document.getElementById(`${field.id}-error`);
    let isValid = true, errorMessage = '';
    field.classList.remove('error', 'success');
    if (errorDiv) errorDiv.classList.remove('show');

    if (!field.value.trim()) {
      errorMessage = 'Este campo é obrigatório.';
      isValid = false;
    } else {
      switch (field.id) {
        case 'projectTitle':
          if (field.value.length < 5) { errorMessage = 'Mínimo 5 caracteres.'; isValid = false; }
          else if (field.value.length > 100) { errorMessage = 'Máximo 100 caracteres.'; isValid = false; }
          break;
        case 'studentName':
          if (field.value.length < 2) { errorMessage = 'Mínimo 2 caracteres.'; isValid = false; }
          else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(field.value)) { errorMessage = 'Apenas letras e espaços.'; isValid = false; }
          break;
        case 'projectDescription':
          if (field.value.length < 50) { errorMessage = 'Mínimo 50 caracteres.'; isValid = false; }
          else if (field.value.length > 2000) { errorMessage = 'Máximo 2000 caracteres.'; isValid = false; }
          break;
      }
    }

    if (!isValid && errorDiv) {
      field.classList.add('error');
      errorDiv.textContent = errorMessage;
      errorDiv.classList.add('show');
    } else {
      field.classList.add('success');
    }
    return isValid;
  }

  validateForm() {
    const inputs = this.form.querySelectorAll('input[required], textarea[required]');
    let valid = true;
    inputs.forEach(input => { if (!this.validateField(input)) valid = false; });
    return valid;
  }

  clearFieldError(field) {
    const errorDiv = document.getElementById(`${field.id}-error`);
    field.classList.remove('error');
    if (errorDiv) errorDiv.classList.remove('show');
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.validateForm()) { this.showError('Corrija os erros antes de enviar.'); return; }
    this.setLoadingState(true);
    this.hideMessages();

    try {
      const data = this.getFormData();
      console.log('Enviando dados:', data);
      const res = await this.submitToGoogleScript(data);
      console.log('Resposta:', res);
      this.showSuccess(`Sucesso! PDF: ${res.fileName || ''}`);
      this.clearForm();
      this.scrollToTop();
    } catch (err) {
      console.error(err);
      let msg = 'Erro ao processar. ';
      if (err.message.includes('NetworkError')) msg += 'Verifique a conexão.';
      else if (err.message.includes('Timeout')) msg += 'Servidor lento.';
      else msg += 'Tente novamente.';
      this.showError(msg);
    } finally {
      this.setLoadingState(false);
    }
  }

  getFormData() {
    const now = new Date();
    return {
      titulo: document.getElementById('projectTitle').value.trim(),
      aluno: document.getElementById('studentName').value.trim(),
      descricao: document.getElementById('projectDescription').value.trim(),
      dataEnvio: now.toLocaleDateString('pt-BR'),
      horaEnvio: now.toLocaleTimeString('pt-BR'),
      timestamp: now.toISOString(),
      responsaveis: {
        instrutor: 'Kronemberger',
        tecnico: 'Marcelo Emmel',
        coordenador: 'Danilo Fagundes',
        pedagogo: 'Gisele Nortanicola'
      }
    };
  }

  async submitToGoogleScript(data) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const resp = await fetch(this.scriptUrl, {
        method: 'POST', mode: 'cors', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data), signal: controller.signal
      });
      clearTimeout(timeout);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      return text ? JSON.parse(text) : {success:true};
    } catch (err) {
      clearTimeout(timeout);
      if (err.name==='AbortError') throw new Error('Timeout');
      throw err;
    }
  }

  setLoadingState(flag) {
    const txt = this.submitButton.querySelector('.btn-text');
    const sp = this.submitButton.querySelector('.loading-spinner');
    this.submitButton.disabled = flag;
    this.clearButton.disabled = flag;
    this.submitButton.classList.toggle('loading', flag);
    if (txt) txt.textContent = flag ? 'Enviando...' : 'Enviar Projeto';
    if (sp) sp.classList.toggle('hidden', !flag);
  }

  showSuccess(msg) {
    this.hideMessages();
    const el = this.successMessage.querySelector('.status-text');
    if (el) el.textContent = msg;
    this.successMessage.classList.remove('hidden');
    this.successMessage.classList.add('fade-in');
    this.scrollToMessage();
  }

  showError(msg) {
    this.hideMessages();
    const el = this.errorMessage.querySelector('#errorText');
    if (el) el.textContent = msg;
    this.errorMessage.classList.remove('hidden');
    this.errorMessage.classList.add('fade-in');
    this.scrollToMessage();
  }

  hideMessages() {
    [this.successMessage, this.errorMessage].forEach(m => {
      if (m) { m.classList.add('hidden'); m.classList.remove('fade-in'); }
    });
  }

  clearForm() {
    this.form.reset();
    this.form.querySelectorAll('input,textarea').forEach(i=>i.classList.remove('error','success'));
    this.form.querySelectorAll('.field-error').forEach(e=>e.classList.remove('show'));
    const cc = document.getElementById('charCount');
    if (cc) { cc.textContent='0'; cc.style.color='#64748b'; }
    this.form.classList.add('slide-up');
    setTimeout(() => this.form.classList.remove('slide-up'), 300);
  }

  scrollToMessage() {
    setTimeout(()=> {
      const c = document.querySelector('.status-container');
      if (c) c.scrollIntoView({behavior:'smooth',block:'center'});
    },100);
  }

  scrollToTop() {
    setTimeout(()=> window.scrollTo({top:0,behavior:'smooth'}),100);
  }

  setupAutoHideMessages() {
    const obs = new MutationObserver(muts=>{
      muts.forEach(m=>{
        const t=m.target;
        if (t===this.successMessage && !t.classList.contains('hidden')) {
          clearTimeout(this._sTimeout);
          this._sTimeout=setTimeout(()=>t.classList.add('hidden'),15000);
        }
        if (t===this.errorMessage && !t.classList.contains('hidden')) {
          clearTimeout(this._eTimeout);
          this._eTimeout=setTimeout(()=>t.classList.add('hidden'),20000);
        }
      });
    });
    if (this.successMessage) obs.observe(this.successMessage,{attributes:true,attributeFilter:['class']});
    if (this.errorMessage) obs.observe(this.errorMessage,{attributes:true,attributeFilter:['class']});
  }

  addAnimationClasses() {
    setTimeout(()=>{
      document.querySelector('.header')?.classList.add('fade-in');
      setTimeout(()=> document.querySelector('.form-container')?.classList.add('fade-in'),200);
    },100);
  }
}

// Utilitários
class FormUtils {
  static formatText(txt){return txt.trim().replace(/\s+/g,' ');}
  static capitalizeWords(txt){return txt.replace(/\w\S*/g,t=>t.charAt(0).toUpperCase()+t.substr(1).toLowerCase());}
  static sanitizeInput(input){return input.replace(/<[^>]*>?/gm,'');}
}

// Inicialização
document.addEventListener('DOMContentLoaded',()=>{
  new ProjectDashboard();
  // Atalhos de teclado
  document.addEventListener('keydown',e=>{
    if ((e.ctrlKey||e.metaKey)&&e.key==='Enter') {
      const btn=document.getElementById('submitButton');
      if (btn&&!btn.disabled) btn.click();
    }
    if (e.key==='Escape') document.querySelector('.status-container')?.classList.add('hidden');
  });
  // Form change tracking
  let changed=false;
  document.querySelectorAll('input,textarea').forEach(i=>{
    i.addEventListener('input',()=>changed=true);
    i.addEventListener('focus',()=>i.parentElement?.classList.add('focused'));
    i.addEventListener('blur',()=>i.parentElement?.classList.remove('focused'));
  });
  window.addEventListener('beforeunload',e=>{
    if (changed) { e.preventDefault(); e.returnValue='Tem alterações não salvas.'; }
  });
  document.getElementById('projectForm')?.addEventListener('submit',()=>changed=false);
});
