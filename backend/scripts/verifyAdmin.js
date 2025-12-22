const axios = require('axios');

async function verify() {
    try {
        console.log('Attempting login...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@intake.ai',
            password: 'admin1234'
        });

        console.log('Login Status:', loginRes.status);
        console.log('Role:', loginRes.data.user?.role);

        if (loginRes.data.user?.role !== 'admin') {
            console.error('FAIL: User is not admin or role missing.');
            return;
        }

        const token = loginRes.data.token;
        console.log('Token received.');

        console.log('Attempting to access protected admin route...');
        try {
            const jobsRes = await axios.get('http://localhost:5000/api/admin/jobs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Protected Route Status:', jobsRes.status);
            console.log('Jobs found:', jobsRes.data.jobs?.length);
            console.log('SUCCESS: Admin flow verified.');
        } catch (jobErr) {
            console.error('FAIL: Protected route access failed:', jobErr.response?.status, jobErr.response?.data);
            if (jobErr.response?.status === 401) {
                console.log('Note: This might be due to server not recognizing the new token format or middleware.');
            }
        }

    } catch (err) {
        console.error('Login failed:', err.response?.status, err.response?.data);
        console.error('This implies the server has NOT picked up the code changes (authController/User model).');
    }
}

verify();
