document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('login-modal');
    const trigger = document.getElementById('login-trigger');
    const closeBtn = document.querySelector('.close');
    const loginForm = document.getElementById('login-form');

    // Modal Control
    trigger.onclick = () => {
        modal.style.display = 'block';
    }

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    }

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // Login Submission
    loginForm.onsubmit = (e) => {
        e.preventDefault();

        // Simulating authentication
        const submitBtn = loginForm.querySelector('button');
        submitBtn.innerText = 'Authenticating...';
        submitBtn.disabled = true;

        setTimeout(() => {
            alert('Access Granted. Redirecting to Command Center.');
            window.location.href = 'admin/admin.html';
        }, 1500);
    }
});
