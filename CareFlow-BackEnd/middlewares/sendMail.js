import nodemailer from 'nodemailer';

const tronsport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
    },
});
    
export default tronsport;