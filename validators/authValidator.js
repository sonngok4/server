const validateSignupData = (email, password, name) => {
    if (!email || !password || !name) {
        return {
            isValid: false,
            message: 'Please provide email, password, and name',
        };
    }
    return { isValid: true };
};

const validateLoginData = (email, password) => {
    if (!email || !password) {
        return {
            isValid: false,
            message: 'Please provide email and password',
        };
    }
    return { isValid: true };
};

module.exports = {
    validateSignupData,
    validateLoginData,
};
