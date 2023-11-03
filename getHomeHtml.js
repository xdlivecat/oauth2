/**
 * 
 * While templating libraries are often used for html page construction,
 * this sample uses a function to keep it as simple as possible for ease of understanding.
 */

export function getHomeHtml(userData) {
    return `
        <html>
        <head>
        <title>User Profile</title>
        <style>
            body {
                background-color: #222;
                color: #fff;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
            }
            h1 {
                font-size: 24px;
            }
            img {
                border-radius: 50%;
                margin: 20px;
            }
            p {
                font-size: 18px;
                line-height: .5;
            }
            a {
                color: #ff5722;
                text-decoration: none;
                font-weight: bold;
                margin-top: 10px;
                display: block;
            }
        </style>
        </head>
        <body>
        <img src="${userData.picture}" alt="User Picture" width="150" height="150">
            <h1>Hello, ${userData.nickname}</h1>
            <p><b>Username:</b> ${userData.preferred_username}</p>
            <p><b>User ID:</b> ${userData.sub}</p>
            <a href="${userData.profile}" target="_blank">🔗 View on Roblox</a>
            <a href="/logout">Logout</a>
        </body>
        </html>
    `;
}
