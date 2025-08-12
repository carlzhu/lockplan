document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerLink = document.getElementById('register-link');
    const loginLink = document.getElementById('login-link');
    const logoutBtn = document.getElementById('logout-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.querySelector('.toast-message');
    const quickInput = document.getElementById('quick-input');
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const submitInputBtn = document.getElementById('submit-input-btn');
    const aiStatus = document.querySelector('.ai-status');
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginModal();
    }
    
    // Event Listeners
    registerLink.addEventListener('click', function() {
        hideLoginModal();
        showRegisterModal();
    });
    
    loginLink.addEventListener('click', function() {
        hideRegisterModal();
        showLoginModal();
    });
    
    logoutBtn.addEventListener('click', function() {
        logout();
    });
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        register();
    });
    
    voiceInputBtn.addEventListener('click', function() {
        startVoiceInput();
    });
    
    submitInputBtn.addEventListener('click', function() {
        processInput();
    });
    
    quickInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            processInput();
        }
    });
    
    // Task checkbox functionality
    document.querySelectorAll('.task-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskItem = this.closest('.task-item');
            if (this.checked) {
                taskItem.style.opacity = '0.6';
                showToast('Task marked as completed');
            } else {
                taskItem.style.opacity = '1';
                showToast('Task marked as not completed');
            }
        });
    });
    
    // Functions
    function showLoginModal() {
        loginModal.classList.add('active');
    }
    
    function hideLoginModal() {
        loginModal.classList.remove('active');
    }
    
    function showRegisterModal() {
        registerModal.classList.add('active');
    }
    
    function hideRegisterModal() {
        registerModal.classList.remove('active');
    }
    
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    function login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Simulate API call
        setTimeout(() => {
            // For demo purposes, just accept any login
            localStorage.setItem('token', 'demo-token');
            localStorage.setItem('username', username);
            hideLoginModal();
            document.querySelector('.username').textContent = `Welcome, ${username}`;
            showToast('Login successful');
        }, 1000);
    }
    
    function register() {
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match');
            return;
        }
        
        // Simulate API call
        setTimeout(() => {
            // For demo purposes, just accept any registration
            hideRegisterModal();
            showLoginModal();
            showToast('Registration successful. Please login.');
        }, 1000);
    }
    
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        showLoginModal();
        showToast('Logged out successfully');
    }
    
    function startVoiceInput() {
        if (!('webkitSpeechRecognition' in window)) {
            showToast('Speech recognition not supported in this browser');
            return;
        }
        
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = function() {
            voiceInputBtn.classList.add('active');
            statusIndicator.style.backgroundColor = 'var(--warning-color)';
            statusText.textContent = 'Listening...';
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            quickInput.value = transcript;
            statusIndicator.style.backgroundColor = 'var(--info-color)';
            statusText.textContent = 'Processing...';
            
            // Simulate AI processing
            setTimeout(() => {
                processInput();
            }, 1000);
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            voiceInputBtn.classList.remove('active');
            statusIndicator.style.backgroundColor = 'var(--danger-color)';
            statusText.textContent = 'Error occurred';
            
            setTimeout(() => {
                statusIndicator.style.backgroundColor = 'var(--success-color)';
                statusText.textContent = 'AI ready';
            }, 2000);
        };
        
        recognition.onend = function() {
            voiceInputBtn.classList.remove('active');
        };
        
        recognition.start();
    }
    
    function processInput() {
        const inputText = quickInput.value.trim();
        if (!inputText) return;
        
        statusIndicator.style.backgroundColor = 'var(--info-color)';
        statusText.textContent = 'Processing...';
        
        // Simulate AI processing
        setTimeout(() => {
            // Add the input to recent inputs
            const inputList = document.querySelector('.input-list');
            const newInput = document.createElement('div');
            newInput.className = 'input-item';
            newInput.innerHTML = `
                <p>"${inputText}"</p>
                <div class="input-actions">
                    <span class="material-icons">visibility</span>
                    <span class="material-icons">edit</span>
                </div>
            `;
            inputList.insertBefore(newInput, inputList.firstChild);
            
            // Create tasks based on input
            createTasksFromInput(inputText);
            
            // Reset input and status
            quickInput.value = '';
            statusIndicator.style.backgroundColor = 'var(--success-color)';
            statusText.textContent = 'AI ready';
            
            showToast('Input processed successfully');
        }, 2000);
    }
    
    function createTasksFromInput(inputText) {
        // This is a simplified demo implementation
        // In a real app, this would call the backend API
        
        // For demo purposes, just create a simple task
        const taskList = document.getElementById('today-tasks');
        const newTask = document.createElement('div');
        newTask.className = 'task-item';
        
        const taskId = 'task' + Math.floor(Math.random() * 1000);
        const currentTime = new Date();
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        const timeString = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
        
        newTask.innerHTML = `
            <div class="task-checkbox">
                <input type="checkbox" id="${taskId}">
                <label for="${taskId}"></label>
            </div>
            <div class="task-content">
                <h3>${inputText.length > 50 ? inputText.substring(0, 47) + '...' : inputText}</h3>
                <p class="task-time"><span class="material-icons">schedule</span> ${timeString}</p>
                <span class="task-category personal">Personal</span>
            </div>
        `;
        
        taskList.insertBefore(newTask, taskList.firstChild);
        
        // Add event listener to the new checkbox
        const checkbox = newTask.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                newTask.style.opacity = '0.6';
                showToast('Task marked as completed');
            } else {
                newTask.style.opacity = '1';
                showToast('Task marked as not completed');
            }
        });
    }
    
    // Initialize username if logged in
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        document.querySelector('.username').textContent = `Welcome, ${savedUsername}`;
    }
});