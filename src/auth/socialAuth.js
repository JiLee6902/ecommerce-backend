'use strict'

const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

class SocialAuthUtils {
    static googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    static async verifyGoogleToken(token) {
        const googleData = await this.googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        return googleData;
    }

    static async verifyFacebookToken(token) {
        const { data } = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`);
        return data;
    }
}

module.exports = SocialAuthUtils;