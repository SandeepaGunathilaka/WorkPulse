const axios = require('axios');

const testLogin = async () => {
  try {
    // Test with the employee credentials
    const credentials = {
      email: 'ravindupasanjith1542@gmail.com',  // Replace with actual employee email
      password: 'Dinuka@111'  // Replace with the password you set
    };

    console.log('Testing login with:');
    console.log('Email:', credentials.email);
    console.log('Password:', credentials.password);

    console.log('Making request to: http://localhost:5000/api/auth/login');
    const response = await axios.post('http://localhost:5000/api/auth/login', credentials);

    console.log('\n✅ Login successful!');
    console.log('Response:', response.data);
    console.log('Token:', response.data.token);
    console.log('User:', response.data.user);

  } catch (error) {
    console.error('\n❌ Login failed:');
    console.error('Error message:', error.response?.data?.message || error.message);
    console.error('Full error:', error.response?.data);
  }
};

testLogin();