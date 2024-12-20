'user-strict'

const shopModel = require("../models/shop.model")
const userModel = require("../models/user.model")
const keytokenModel = require("../models/keytoken.model");
const roleModel = require("../models/role.model")
const bcrypt = require('bcryptjs');
const crypto = require('crypto')
const KeyTokenService = require("./keyToken.service")
const { createTokenPair, verifyJWT } = require("../auth/authUtils")
const { getInfoData } = require("../utils")
const { BadRequestError, AuthFailureError, ForbiddenError } = require("../core/error.response");
const { insertInventory } = require("../models/repositories/inventory.repo");
const SocialAuthUtils = require("../auth/socialAuth");
const { sendAccountForGoogleAndFacebook, sendEmailVerification } = require("./email.service");
const otpModel = require("../models/otp.model");
const staffModel = require("../models/staff.model");




class AccessService {
    static handlerRefreshToken = async ({ keyStore, user, refreshToken }) => {
        const { userId, email } = user;
        if (!keyStore.isActive) {
            throw new ForbiddenError('Key token is inactive. Please re-login.');
        }
        if (keyStore.refreshTokensUsed.includes(refreshToken)) {
            await KeyTokenService.deleteKeyById(userId);
            throw new ForbiddenError('Something wrong happend! Pls relogin')
        }

        if (keyStore.refreshToken !== refreshToken) throw new AuthFailureError('Shop not registed')
        const foundAccount = await this.findAccountByEmail(email);
        if (!foundAccount) throw new AuthFailureError('Account not registered');

        const role = foundAccount.role ? 'shop' : (foundAccount.usr_role.rol_name || 'user');

        const tokens = await createTokenPair(
            { userId, email, role }, publicKey, privateKey
        )

        await keyStore.updateOne({
            $set: {
                refreshToken: tokens.refreshToken
            },
            $addToSet: {
                refreshTokensUsed: refreshToken
            }
        })

        return {
            user,
            tokens
        }

    }

    static logout = async (keyStore) => {
        const filter = { _id: keyStore._id };
        const update = { isActive: false };
        const options = { new: true };
        await keytokenModel.findOneAndUpdate(filter, update, options);
        const delKey = await KeyTokenService.removeKeyById(keyStore._id)


        req.session.destroy((err) => {
            if (err) {
                myLogger.error('Logout failed', {
                    sessionId: String(sessionId),
                    requestId: req.requestId,
                    context: '/logout',
                    metadata: { error: err.message }
                });
            }
            myLogger.log('User logged out successfully', {
                sessionId: String(sessionId),
                requestId: req.requestId,
                context: '/logout'
            });
            res.clearCookie('connect.sid');
        });

        return delKey;
    }

    static login = async ({ email, password, refreshToken }) => {
        const foundAccount = await this.findAccountByEmail(email);
        if (!foundAccount) {
            throw new BadRequestError('Error: Shop not registered!')
        }

        if (refreshToken != null) {
            const keyStore = await KeyTokenService.findByUserId(foundAccount._id)
            await keyStore.updateOne({
                $addToSet: {
                    refreshTokensUsed: refreshToken
                }
            })
        }

        const match = await bcrypt.compare(password, foundAccount.password)
        if (!match) throw new AuthFailureError('Authentiacaion error')

        const privateKey = crypto.randomBytes(64).toString('hex')
        const publicKey = crypto.randomBytes(64).toString('hex')
        const { _id: userId } = foundAccount;
        const role = foundAccount.role ? 'shop' : (foundAccount.usr_role.rol_name || 'user');

        const tokens = await createTokenPair(
            { userId, email, role }, publicKey, privateKey
        )


        await KeyTokenService.createKeyToken({
            userId,
            refreshToken: tokens.refreshToken,
            privateKey,
            publicKey,
            userModel: role === 'shop' ? 'Shop' : 'User'
        })

        return {
            shop: getInfoData({ fields: ['_id', 'name', 'email'], object: foundAccount }),
            tokens
        }
    };

    static async findAccountByEmail(email) {
        const shop = await shopModel.findOne({ email });
        if (shop) return shop;

        const user = await userModel.findOne({ usr_email: email }).populate('usr_role');
        return user;
    }

    static async handleExistingSocialLogin(user) {
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        const tokens = await createTokenPair(
            { userId: user._id, email: user.usr_email, role: 'user' },
            publicKey,
            privateKey
        );

        await KeyTokenService.createKeyToken({
            userId: user._id,
            refreshToken: tokens.refreshToken,
            privateKey,
            publicKey,
            userModel: 'User'
        });

        return {
            user: getInfoData({
                fields: ['_id', 'usr_name', 'usr_email', 'usr_avatar'],
                object: user
            }),
            tokens
        };
    }

    static loginWithGoogle = async ({ idToken }) => {
        const googleData = await SocialAuthUtils.verifyGoogleToken(idToken)
        const { email, name, picture } = googleData.getPayload();

        if (!email) {
            throw new BadRequestError('Email not provided by Google/Facebook');
        }
        const array = ['userModel', 'shopModel', 'staffModel']
        const mail = ['usr_email', 'email', 'staff_email']
        for (let i = 0; i < array.length; i++) {
            const model = array[i];
            const attribute = mail[i];
            const account = await model.findOne({ [attribute]: email }).lean();
            if (account) {
                return AccessService.handleExistingSocialLogin(account);
            }
        }

        const otpToken = crypto.randomBytes(32).toString('hex');
        await otpModel.create({
            otp_token: otpToken,
            otp_email: email,
            otp_status: 'pending',
            expireAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
        });

        const redisClient = getIORedis().instanceConnect;
        await redisClient.set(
            `social_auth-${otpToken}`,
            JSON.stringify({
                name,
                email,
                picture,
                provider: 'google'
            }),
            2 * 60 * 60
        );

        await sendEmailVerification({
            email,
            replacements: {
                user_name: name,
                verification_link: `http://localhost:3000//verify-social-account?token=${otpToken}`,
                provider: 'Google'
            }
        })

        return {
            status: 'VERIFICATION_NEEDED',
            message: 'Please check your email to complete registration'
        }

    }

    static loginWithFacebook = async ({ accessToken }) => {
        const { email, name, picture } = await SocialAuthUtils.verifyFacebookToken(accessToken)

        if (!email) {
            throw new BadRequestError('Email not provided by Google/Facebook');
        }
        const array = ['userModel', 'shopModel', 'staffModel']
        const mail = ['usr_email', 'email', 'staff_email']
        for (let i = 0; i < array.length; i++) {
            const model = array[i];
            const attribute = mail[i];
            const account = await model.findOne({ [attribute]: email }).lean();
            if (account) {
                return AccessService.handleExistingSocialLogin(account);
            }
        }

        const otpToken = crypto.randomBytes(32).toString('hex');
        await otpModel.create({
            otp_token: otpToken,
            otp_email: email,
            otp_status: 'pending',
            expireAt: new Date(Date.now() +  60 * 60 * 1000)
        });

        const redisClient = getIORedis().instanceConnect;
        await redisClient.set(
            `social_auth-${otpToken}`,
            JSON.stringify({
                name,
                email,
                picture,
                provider: 'facebook'
            }),
             60 * 60
        );

        await sendEmailVerification({
            email,
            replacements: {
                user_name: name,
                verification_link: `http://localhost:3000/verify-social-account?token=${otpToken}`,
                provider: 'Google'
            }
        })

        return {
            status: 'VERIFICATION_NEEDED',
            message: 'Please check your email to complete registration'
        }

    }

    static async verifyAndCreateSocialAccount({ verificationToken }) {
        const otp = await otpModel.findOne({ 
            otp_token: verificationToken,
            otp_status: 'pending'
        });
        
        if (!otp) {
            throw new BadRequestError('Expired verification token');
        }

        const redisClient = getIORedis().instanceConnect;
        const userData = await redisClient.get(`social_auth-${verificationToken}`);
        if (!userData) {
            throw new BadRequestError('Verification expired');
        }

        const { name, email, picture, provider } = JSON.parse(userData);

        const roleDoc = await roleModel.findOne({ rol_name: 'user' });
        if (!roleDoc) {
            throw new BadRequestError('User role not found');
        }

        const hashedPassword = await bcrypt.hash(email, 10);
        const user = await userModel.create({
            usr_name: name,
            usr_email: email,
            usr_avatar: picture,
            usr_role: roleDoc._id,
            usr_password: hashedPassword,
            usr_status: 'active',
            usr_provider: provider
        });

        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        const tokens = await createTokenPair(
            { userId: user._id, email: user.usr_email, role: 'user' },
            publicKey,
            privateKey
        );

        await KeyTokenService.createKeyToken({
            userId: user._id,
            refreshToken: tokens.refreshToken,
            privateKey,
            publicKey,
            userModel: 'User'
        });

        await otpModel.updateOne(
            { otp_token: verificationToken },
            { otp_status: 'active' }
        );

        await sendAccountForGoogleAndFacebook({
            username: name,
            email: email,
            password: email 
        });

        return {
            user: getInfoData({
                fields: ['_id', 'usr_name', 'usr_email', 'usr_avatar'],
                object: user
            }),
            tokens
        };
    }


    static async signUpUser({
        usr_name,
        usr_email,
        usr_password,
        usr_phone,
        usr_sex,
        usr_date_of_birth
    }) {
        const holderUser = await userModel.findOne({ usr_email }).lean();
        if (holderUser) {
            throw new BadRequestError('Error: User already registered!');
        }
        const holderShop = await shopModel.findOne({ email }).lean();
        if (holderShop) {
            throw new BadRequestError('Error: User already registered!');
        }

        const passwordHash = await bcrypt.hash(usr_password, 10);
        const roleDoc = await roleModel.findOne({ rol_name: 'user' });
        if (!roleDoc) {
            throw new BadRequestError('Error: User role not found!');
        }

        const newUser = await userModel.create({
            usr_name,
            usr_email,
            usr_password: passwordHash,
            usr_phone,
            usr_sex,
            usr_date_of_birth,
            usr_role: roleDoc._id,
        });

        if (newUser) {
            const privateKey = crypto.randomBytes(64).toString('hex');
            const publicKey = crypto.randomBytes(64).toString('hex');

            const keyStore = await KeyTokenService.createKeyToken({
                userId: newUser._id,
                publicKey,
                privateKey,
                userModel: 'User'
            });

            if (!keyStore) {
                throw new BadRequestError('Error: Cannot create KeyToken!');
            }

            const tokens = await createTokenPair(
                { userId: newUser._id, email: usr_email, role: 'user' },
                publicKey,
                privateKey
            );

            return {
                user: getInfoData({
                    fields: ['_id', 'usr_name', 'usr_email', 'usr_phone', 'usr_sex', 'usr_date_of_birth'],
                    object: newUser
                }),
                tokens
            };
        }

        throw new BadRequestError('Error: Cannot create user!');
    }

    static async signUpShop({ name, email, password }) {
        const holderShop = await shopModel.findOne({ email }).lean();
        if (holderShop) {
            throw new BadRequestError('Error: Shop already registered!');
        }
        const holderUser = await userModel.findOne({ email }).lean();
        if (holderUser) {
            throw new BadRequestError('Error: Shop already registered!');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const roleDoc = await roleModel.findOne({ rol_name: 'shop' });

        const newShop = await shopModel.create({
            name,
            email,
            password: passwordHash,
            status: 'inactive',
            verify: false,
            role: roleDoc._id
        });

        if (newShop) {

            await inventory.findOneAndUpdate({ inven_shopId: newShop._id }, { new: true, upsert: true })

            const privateKey = crypto.randomBytes(64).toString('hex');
            const publicKey = crypto.randomBytes(64).toString('hex');

            const keyStore = await KeyTokenService.createKeyToken({
                userId: newShop._id,
                publicKey,
                privateKey,
                userModel: 'Shop'
            });

            if (!keyStore) {
                throw new BadRequestError('Error: Cannot create KeyToken!');
            }

            const tokens = await createTokenPair(
                { userId: newShop._id, email, role: 'shop' },
                publicKey,
                privateKey,

            );

            return {
                shop: getInfoData({ fields: ['_id', 'name', 'email', 'status'], object: newShop }),
                tokens
            };
        }

        throw new BadRequestError('Error: Cannot create shop!');
    }
}

module.exports = AccessService