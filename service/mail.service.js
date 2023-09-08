const nodemailer = require("nodemailer");

module.exports = {
    sendEmail: async ({ to, name }) => {
        let otp = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);

        var transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: `${to}`,
            subject: "Survey",
            text: "One Time Password",
            html: `<!DOCTYPE html>
            <html lang="en">
            
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
            </head>
            <style>
                body {
                    font-family: 'Ubuntu', sans-serif;
                    background-color: #f5f5f5;
                }
            
                * {
                    box-sizing: border-box;
                }
            
                p:last-child {
                    margin-top: 0;
                }
            
                img {
                    max-width: 100%;
                }
            </style>
            
            <body style="margin: 0; padding: 0;">
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td style="padding: 20px 0 30px 0;">
                            <table align="center" cellpadding="0" cellspacing="0" width="600" style=" border-collapse: collapse; border: 1px solid #ececec; background-color: #fff;">
                                <tr>
                                    <td align="center" style="position: relative;">
                                        <div
                                        class="company-logo-align"
                                        style=" padding: 2rem 2rem 1rem 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto;"
                                        align="center">
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div class="user-information" 
                                        style="padding: 25px; background-color: #021f4c;"
                                        >
                                        <h1 align="center" style="color: #fff; font-size: 35px; font-weight: 500; margin: 0 0 1rem 0;">Hi, ${name} </h1>
                                        <p align="center" style="color: #fff; font-size: 30px; font-weight: 500; margin: 0 0 1rem 0;">Welcome to Survey</p>
                                        </div>
                                      
                                    </td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td style="padding: 3rem 2rem 1rem 2rem;">
                                      <h2 align="center" style="color: #585d6a; font-size: 30px; ">Verify your Email Address</h2>
                                      <p align="center" style="color: #585d6a; font-size: 14px; margin: 2.50rem 0 2rem 0;">Please find below your one time passcode.</p>
                                      <h6 align="center" style="font-size: 40px; color: #585d6a; margin: 0;  margin-top: 0;">OTP : ${otp}</h6>
                                    </td>
                                </tr>
                                
                                                             <tr>
                                    <td style="padding: 2rem;">
                                      <p align="center" style="color: #585d6a; font-size: 14px; margin: 0;">
                                                     </p>
                                    </td>
                                </tr>
                              
                        
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            
            </html>`,
        };

        try {
            await transporter.sendMail(mailOptions);
            return otp;
        } catch (error) {
            console.log("mail sending wrror", error);
            return new Error("mail not sent, plase try again later");
        }
    },
    sendQueryEmail: async ({ email, userName: name, query, subject }) => {
        var transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: `${email}`,
            subject: subject,
            html: `<!DOCTYPE html>
            <html lang="en">
            
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
            </head>
            <style>
                body {
                    font-family: 'Ubuntu', sans-serif;
                    background-color: #f5f5f5;
                }
            
                * {
                    box-sizing: border-box;
                }
            
                p:last-child {
                    margin-top: 0;
                }
            
                img {
                    max-width: 100%;
                }
            </style>
            
            <body style="margin: 0; padding: 0;">
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td style="padding: 20px 0 30px 0;">
                            <table align="center" cellpadding="0" cellspacing="0" width="600" style=" border-collapse: collapse; border: 1px solid #ececec; background-color: #fff;">
                                <tr>
                                    <td align="center" style="position: relative;">
                                        <div
                                        class="company-logo-align"
                                        style=" padding: 2rem 2rem 1rem 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto;"
                                        align="center">
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div class="user-information" 
                                        style="padding: 25px; background-color: #021f4c;"
                                        >
                                        <p align="center" style="color: #fff; font-size: 30px; font-weight: 500; margin: 0 0 1rem 0;">Survey</p>
                                        <h1 align="center" style="color: #fff; font-size: 35px; font-weight: 500; margin: 0 0 1rem 0;">Hi, ${name} </h1>
                                        </div>
                                      
                                    </td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td style="padding: 3rem 2rem 1rem 2rem;">
                                      <h2 align="center" style="color: #585d6a; font-size: 30px; ">${subject}</h2>
                                      <p align="center" style="color: #585d6a; font-size: 14px; margin: 2.50rem 0 2rem 0;">${query}</p>
                                    </td>
                                </tr>
                                                             <tr>
                                    <td style="padding: 2rem;">
                                      <p align="center" style="color: #585d6a; font-size: 14px; margin: 0;">
                                                     </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            
            </html>`,
        };

        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.log("mail sending wrror", error);
            return new Error("mail not sent, plase try again later");
        }
    },
};
