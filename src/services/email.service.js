

'use strict'


const { newOtp } = require('./otp.service')
const { getTemplate } = require('./template.service')
const transport = require('../dbs/init.nodemailer')
const { NotFoundError } = require('../core/error.response')
const { replacePlaceHolder } = require('../utils')


const sendEmailLinkVerify = async ({
    html,
    toEmail,
    subject = 'Xác nhận email đăng ký',
    text = 'xác nhận...'
}) => {
    try {
        const mailOptions = {
            from: ' "ShopDEV" <lqchi.service@gmail.com> ',
            to: toEmail,
            subject,
            text,
            html
        }

        transport.sendMail(mailOptions, (err, info) => {
            if (err) {
                return console.log(err)
            }
            console.log('Message sent::', info.messageId)
        })
    } catch (error) {
        console.error(`Lỗi gửi email`, error)
        return error;
    }
}


const sendEmailToken = async ({
    email = null
}) => {
    try {
        //1. get token
        const token = newOtp({ email })

        // 2. get template
        const template = await getTemplate({
            tem_name: 'HTML EMAIL TOKEN'
        })

        if (!template) {
            throw new NotFoundError('Không tìm thấy template')
        }
        //3. replate template
        const content = replacePlaceHolder(
            template.tem_html,
            {
                link_verify: `http://localhost:3056/v1/api/user/welcome-back?token=${token.otp_token}`
            }
        )
        //4 send email
        sendEmailLinkVerify({
            html: content,
            toEmail: email,
            subject: 'Vui lòng xác nhận địa chỉ Email đăng ký ShopDEV.com'
        }).catch(err => console.error(err))

        return token;
    } catch (error) {
        console.error(error)
    }
}


const sendEmailPassword = async ({
    email
}) => {
    try {
        const template = await getTemplate({
            tem_name: 'HTML EMAIL PASSWORD'
        })

        if (!template) {
            throw new NotFoundError('Không tìm thấy template')
        }
        const content = replacePlaceHolder(
            template.tem_html,
            {
                my_password: email
            }
        )
        sendEmailLinkVerify({
            html: content,
            toEmail: email,
            subject: 'ShopDEV xin cung cấp thông tin tài khoản cho bạn!'
        }).catch(err => console.error(err))


    } catch (error) {
        console.error(error)
    }
}

const sendEmailForgotPassword = async ({
    email,
    resetLink
}) => {
    try {
        const template = await getTemplate({
            tem_name: 'HTML EMAIL FORGOT PASSWORD'
        })
        if (!template) {
            throw new NotFoundError('Không tìm thấy template')
        }
        const content = replacePlaceHolder(
            template.tem_html,
            {
                reset_link: resetLink
            }
        )
        await sendEmailLinkVerify({
            html: content,
            toEmail: email,
            subject: 'Đặt Lại Mật Khẩu Cho Tài Khoản ShopDEV của Bạn'
        })

    } catch (error) {
        console.error('Lỗi gửi email forgot password:', error)
        throw new Error('Failed to send forgot password email')
    }
}

const sendEmailOrderShipping = async ({
    email, orderId, userName, totalAmount, orderStatus = 'shipped'
}) => {
    try {
        const template = await getTemplate({
            tem_name: 'HTML EMAIL ORDER SHIPPING'
        })
        if (!template) {
            throw new NotFoundError('Không tìm thấy template')
        }
        const content = replacePlaceHolder(
            template.tem_html,
            {
                userName: userName,
                orderId: orderId,
                totalAmount: totalAmount,
                orderStatus: orderStatus
            }
        )
        await sendEmailLinkVerify({
            html: content,
            toEmail: email,
            subject: 'Xác Nhận Đơn Hàng'
        })

    } catch (error) {
        console.error('Lỗi gửi email order shipping:', error)
        throw new Error('Failed to send order shipping email')
    }
}

const sendEmailConfirmOrder = async ({
    email, action, productId, quantity
}) => {
    try {
        const template = await getTemplate({
            tem_name: 'HTML EMAIL ORDER'
        })
        if (!template) {
            throw new NotFoundError('Không tìm thấy template')
        }
        const content = replacePlaceHolder(
            template.tem_html,
            {
                action: action,
                productId: productId,
                quantity: quantity
            }
        )
        await sendEmailLinkVerify({
            html: content,
            toEmail: email,
            subject: 'Xác Nhận Đơn Hàng'
        })

    } catch (error) {
        console.error('Lỗi gửi email:', error)
        throw new Error('Failed to send email')
    }
}

const sendEmailDQLNoti = async ({
    contentData
}) => {
    try {
        const template = await getTemplate({
            tem_name: 'HTML EMAIL ORDER'
        })
        if (!template) {
            throw new NotFoundError('Không tìm thấy template')
        }
        const contentSend = replacePlaceHolder(
            template.tem_html,
            {
                content: contentData
            }
        )
        await sendEmailLinkVerify({
            html: contentSend,
            toEmail: 'admin@gmail.com',
            subject: 'DLQ Alert: Notification Processing Failed'
        })

    } catch (error) {
        console.error('Lỗi gửi email:', error)
        throw new Error('Failed to send email')
    }
}

const sendEmailVerification = async ({
    email,
    replacements
}) => {
    try {
        const template = await getTemplate({
            tem_name: 'HTML EMAIL VERIFY'
        })
        if (!template) {
            throw new NotFoundError('Không tìm thấy template')
        }

        const contentSend = replacePlaceHolder(
            template.tem_html,
            {
                user_name: replacements.user_name,
                verification_link: replacements.verification_link,
                provider: replacements.provider,
                email: email
            }
        )
        await sendEmailLinkVerify({
            html: contentSend,
            toEmail: email,
            subject: 'Verify Your Email Address',
        })

    } catch (error) {
        console.error('Lỗi gửi email:', error)
        throw new Error('Failed to send email')
    }
}

const sendAccountForGoogleAndFacebook = async ({
    username,
    email,
    password,
    loginUrl = `http://localhost:3000/login`
}) => {
    try {
        const template = await getTemplate({
            tem_name: 'HTML NEW ACCOUNT'
        })
        if (!template) {
            throw new NotFoundError('Không tìm thấy template')
        }


        const contentSend = replacePlaceHolder(
            template.tem_html,
            {
                user_name: user_name,
                email: email,
                password: password,
                login_url: loginUrl
            }
        )
        await sendEmailLinkVerify({
            html: contentSend,
            toEmail: email,
            subject: 'Your New Account Information',
        });
    } catch (error) {
        console.error('Lỗi gửi email:', error)
        throw new Error('Failed to send email')
    }
}

const sendMailCancelOrder = async ({
    recipientName ,
    orderId 
}) => {
    try {
        const template = await getTemplate({
            tem_name: 'HTML CANCEL ORDER'
        })
        if (!template) {
            throw new NotFoundError('Không tìm thấy template')
        }
        const contentSend = replacePlaceHolder(
            template.tem_html,
            {
                recipientName: recipientName,
                orderId: orderId,
            }
        )
        await sendEmailLinkVerify({
            html: contentSend,
            toEmail: email,
            subject: 'Order Cancel',
        });
    } catch (error) {
        console.error('Lỗi gửi email:', error)
        throw new Error('Failed to send email')
    }
}

module.exports = {
    sendEmailToken,
    sendEmailPassword,
    sendEmailForgotPassword,
    sendEmailOrderShipping,
    sendEmailConfirmOrder,
    sendEmailDQLNoti,
    sendEmailVerification,
    sendAccountForGoogleAndFacebook,
    sendMailCancelOrder
}

