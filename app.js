// Dashboard Educacional - Cadastro de Ideias
class ProjectDashboard {
    constructor() {
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbzBQZD4v7gEVQVdDby4SmVrU3SI_oFN-x5k22CYIbmQoFNxWdtQEuZVtrLzcm33omMzRQ/exec';
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
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Clear form button
        this.clearButton.addEventListener('click', () => this.clearForm());
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Auto-hide status messages after 10 seconds
        this.setupAutoHideMessages();
    }

    setupCharacterCounter() {
        const textarea = document.getElementById('projectDescription');
        const charCount = document.getElementById('charCount');
        
        textarea.addEventListener('input', () => {
            const count = textarea.value.length;
            charCount.textContent = count;
            
            // Visual feedback for character count
            if (count > 1000) {
                charCount.style.color = '#ef4444';
            } else if (count > 800) {
                charCount.style.color = '#f59e0b';
            } else {
                charCount.style.color = '#64748b';
            }
        });
    }

    setupFormValidation() {
        const inputs = this.form.querySelectorAll('input[required], textarea[required]');
        
        inputs.forEach(input => {
            // Add success state on valid input
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
        let isValid = true;
        let errorMessage = '';

        // Clear previous states
        field.classList.remove('error', 'success');
        errorDiv.classList.remove('show');

        // Required field validation
        if (!field.value.trim()) {
            errorMessage = 'Este campo é obrigatório.';
            isValid = false;
        } else {
            // Specific field validations
            switch (field.id) {
                case 'projectTitle':
                    if (field.value.trim().length < 5) {
                        errorMessage = 'O título deve ter pelo menos 5 caracteres.';
                        isValid = false;
                    } else if (field.value.trim().length > 100) {
                        errorMessage = 'O título deve ter no máximo 100 caracteres.';
                        isValid = false;
                    }
                    break;
                    
                case 'studentName':
                    if (field.value.trim().length < 2) {
                        errorMessage = 'O nome deve ter pelo menos 2 caracteres.';
                        isValid = false;
                    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(field.value.trim())) {
                        errorMessage = 'O nome deve conter apenas letras e espaços.';
                        isValid = false;
                    }
                    break;
                    
                case 'projectDescription':
                    if (field.value.trim().length < 50) {
                        errorMessage = 'A descrição deve ter pelo menos 50 caracteres.';
                        isValid = false;
                    } else if (field.value.trim().length > 2000) {
                        errorMessage = 'A descrição deve ter no máximo 2000 caracteres.';
                        isValid = false;
                    }
                    break;
            }
        }

        if (!isValid) {
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
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    clearFieldError(field) {
        const errorDiv = document.getElementById(`${field.id}-error`);
        field.classList.remove('error');
        errorDiv.classList.remove('show');
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Validate form
        if (!this.validateForm()) {
            this.showError('Por favor, corrija os erros no formulário antes de enviar.');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        this.hideMessages();

        try {
            // Prepare form data
            const formData = this.getFormData();
            
            // Send to Google Apps Script
            const response = await this.submitToGoogleScript(formData);
            
            // Handle successful response
            this.showSuccess('Projeto enviado com sucesso! O PDF foi gerado e salvo no Google Drive.');
            this.clearForm();
            this.scrollToTop();
            
        } catch (error) {
            console.error('Erro ao enviar projeto:', error);
            
            // Show user-friendly error message
            let errorMsg = 'Erro ao processar sua solicitação. ';
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMsg += 'Verifique sua conexão com a internet e tente novamente.';
            } else if (error.message.includes('Timeout')) {
                errorMsg += 'O servidor está demorando para responder. Tente novamente em alguns minutos.';
            } else if (error.message.includes('404') || error.message.includes('Not Found')) {
                errorMsg += 'Serviço temporariamente indisponível. Tente novamente mais tarde.';
            } else {
                errorMsg += 'Tente novamente em alguns minutos.';
            }
            
            this.showError(errorMsg);
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
        // Create a more robust submission method
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
            // First attempt with POST
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Try to parse JSON response
            let result;
            try {
                const textResponse = await response.text();
                if (textResponse.trim()) {
                    result = JSON.parse(textResponse);
                } else {
                    // Empty response is considered success for Google Apps Script
                    result = { success: true };
                }
            } catch (parseError) {
                console.warn('Resposta não é JSON válido, assumindo sucesso:', parseError);
                result = { success: true };
            }

            // Return successful result
            return result;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Handle different types of errors
            if (error.name === 'AbortError') {
                throw new Error('Timeout - O servidor demorou muito para responder.');
            }
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                // Try alternative method for CORS issues
                try {
                    await this.submitViaForm(data);
                    return { success: true };
                } catch (formError) {
                    throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
                }
            }
            
            throw error;
        }
    }

    async submitViaForm(data) {
        // Alternative submission method using form data
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'object') {
                formData.append(key, JSON.stringify(data[key]));
            } else {
                formData.append(key, data[key]);
            }
        });

        const response = await fetch(this.scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });

        // no-cors mode doesn't allow reading response, so we assume success
        return { success: true };
    }

    setLoadingState(isLoading) {
        const btnText = this.submitButton.querySelector('.btn-text');
        const spinner = this.submitButton.querySelector('.loading-spinner');
        
        if (isLoading) {
            this.submitButton.disabled = true;
            this.submitButton.classList.add('loading');
            btnText.textContent = 'Enviando...';
            spinner.classList.remove('hidden');
        } else {
            this.submitButton.disabled = false;
            this.submitButton.classList.remove('loading');
            btnText.textContent = 'Enviar Projeto';
            spinner.classList.add('hidden');
        }
    }

    showSuccess(message) {
        this.hideMessages();
        this.successMessage.querySelector('.status-text').textContent = message;
        this.successMessage.classList.remove('hidden');
        this.successMessage.classList.add('fade-in');
        this.scrollToMessage();
    }

    showError(message) {
        this.hideMessages();
        this.errorMessage.querySelector('#errorText').textContent = message;
        this.errorMessage.classList.remove('hidden');
        this.errorMessage.classList.add('fade-in');
        this.scrollToMessage();
    }

    hideMessages() {
        this.successMessage.classList.add('hidden');
        this.errorMessage.classList.add('hidden');
        this.successMessage.classList.remove('fade-in');
        this.errorMessage.classList.remove('fade-in');
    }

    clearForm() {
        this.form.reset();
        
        // Clear validation states
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.classList.remove('error', 'success');
        });
        
        // Clear error messages
        const errors = this.form.querySelectorAll('.field-error');
        errors.forEach(error => error.classList.remove('show'));
        
        // Reset character counter
        document.getElementById('charCount').textContent = '0';
        document.getElementById('charCount').style.color = '#64748b';
        
        // Add animation
        this.form.classList.add('slide-up');
        setTimeout(() => this.form.classList.remove('slide-up'), 300);
    }

    scrollToMessage() {
        setTimeout(() => {
            const statusContainer = document.querySelector('.status-container');
            if (statusContainer) {
                statusContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }

    scrollToTop() {
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    }

    setupAutoHideMessages() {
        let successTimeout, errorTimeout;

        // Auto-hide success message
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target === this.successMessage && !this.successMessage.classList.contains('hidden')) {
                    clearTimeout(successTimeout);
                    successTimeout = setTimeout(() => {
                        this.successMessage.classList.add('hidden');
                    }, 10000);
                }
                
                if (mutation.target === this.errorMessage && !this.errorMessage.classList.contains('hidden')) {
                    clearTimeout(errorTimeout);
                    errorTimeout = setTimeout(() => {
                        this.errorMessage.classList.add('hidden');
                    }, 15000);
                }
            });
        });

        observer.observe(this.successMessage, { attributes: true, attributeFilter: ['class'] });
        observer.observe(this.errorMessage, { attributes: true, attributeFilter: ['class'] });
    }

    addAnimationClasses() {
        // Add entrance animations
        setTimeout(() => {
            const header = document.querySelector('.header');
            const formContainer = document.querySelector('.form-container');
            
            if (header) header.classList.add('fade-in');
            setTimeout(() => {
                if (formContainer) formContainer.classList.add('fade-in');
            }, 200);
        }, 100);
    }
}

// Utility functions for enhanced functionality
class FormUtils {
    static formatText(text) {
        return text.trim().replace(/\s+/g, ' ');
    }
    
    static capitalizeWords(text) {
        return text.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }
    
    static sanitizeInput(input) {
        return input.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
    }
}

// Enhanced form interactions
document.addEventListener('DOMContentLoaded', () => {
    // Initialize dashboard
    const dashboard = new ProjectDashboard();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const submitButton = document.getElementById('submitButton');
            if (submitButton && !submitButton.disabled) {
                submitButton.click();
            }
        }
        
        // Escape to clear messages
        if (e.key === 'Escape') {
            dashboard.hideMessages();
        }
    });
    
    // Auto-save draft (in memory only, not persistent)
    let draftData = {};
    const inputs = document.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            draftData[input.id] = input.value;
        });
    });
    
    // Enhance input formatting
    const nameInput = document.getElementById('studentName');
    if (nameInput) {
        nameInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                this.value = FormUtils.capitalizeWords(FormUtils.formatText(this.value));
            }
        });
    }
    
    const titleInput = document.getElementById('projectTitle');
    if (titleInput) {
        titleInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                this.value = FormUtils.formatText(this.value);
            }
        });
    }
    
    // Add visual feedback for form interactions
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            const parent = this.parentElement;
            if (parent) parent.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            const parent = this.parentElement;
            if (parent) parent.classList.remove('focused');
        });
    });
    
    // Prevent accidental form loss
    let formChanged = false;
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            formChanged = true;
        });
    });
    
    window.addEventListener('beforeunload', (e) => {
        if (formChanged) {
            e.preventDefault();
            e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        }
    });
    
    // Reset form changed flag on successful submit
    const form = document.getElementById('projectForm');
    if (form) {
        form.addEventListener('submit', () => {
            formChanged = false;
        });
    }
    
    console.log('Dashboard educacional carregado com sucesso!');
});
