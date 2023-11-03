/**
 * This sample is intended to be used in the context of a privately hosted application server,
 * so it is able to securely use a client secret for authorization.
 *
 * For client-side code, PKCE protocol should be used instead of a client secret
 * in order to avoid sharing the client secret publicly.
 */

import express from "express";
import { Issuer, custom, generators } from "openid-client";
import { getHomeHtml } from "./getHomeHtml.js";
import cookieParser from "cookie-parser";
import axios from "axios";

const app = express();
const port = 3000;
const clientId = '1389804499925155328';
const clientSecret = 'RBX-XfbGTU0z0USmOCaJrRkn2DZ_E8HdUCptdR3-NyrxUWPvsZTDy3mfsbujHuPGhGJa';

// Generating a new secret at runtime invalidates existing cookies if the server restarts.
// Set your own constant cookie secret if you want to keep them alive despite server restarting.
const cookieSecret = process.env.COOKIE_SECRET || generators.random();
const secureCookieConfig = {
    secure: true,
    httpOnly: true,
    signed: true,
};

// Use cookie-parser middleware to parse cookies
app.use(cookieParser(cookieSecret));

// Middleware to check if the user is logged in
function checkLoggedIn(req, res, next) {
    if (req.signedCookies.userData) {
        next();
    } else {
        res.redirect("/login");
    }
}

async function main() {
    // Ingest the OIDC configuration from the discovery document endpoint
    const issuer = await Issuer.discover(
        "https://apis.roblox.com/oauth/.well-known/openid-configuration"
    );

    const client = new issuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: [`http://localhost:${port}/oauth/callback`],
        response_types: ["code"],
        scope: "openid profile",
        id_token_signed_response_alg: "ES256",
    });

    client[custom.clock_tolerance] = 180;

    // Routes
    app.get("/", checkLoggedIn, (req, res) => {
        res.redirect("/home");
    });

    app.get("/login", (req, res) => {
        const state = generators.state();
        const nonce = generators.nonce();

        res
            .cookie("state", state, secureCookieConfig)
            .cookie("nonce", nonce, secureCookieConfig)
            .redirect(
                client.authorizationUrl({
                    scope: client.scope,
                    state,
                    nonce,
                })
            );
    });

    app.get("/logout", async (req, res) => {
        // Revoke the session tokens if available
        const refreshToken = req.signedCookies.refreshToken;

        if (refreshToken) {
            axios.post(
                "https://apis.roblox.com/oauth/v1/token/revoke",
                `token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}`,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );
        }

        // Clear cookies and redirect back to index (which will lead back to login)
        res
            .clearCookie("userData")
            .clearCookie("accessToken")
            .clearCookie("refreshToken")
            .clearCookie("idToken")
            .redirect("/");
    });

    app.get("/oauth/callback", async (req, res) => {
        const params = client.callbackParams(req);
        const tokenSet = await client.callback(
            `http://localhost:${port}/oauth/callback`,
            params,
            {
                state: req.signedCookies.state,
                nonce: req.signedCookies.nonce,
            }
        );

        // Store user details in the userData and session tokens in their respective cookies
        res
            .cookie("userData", tokenSet.claims(), secureCookieConfig)
            .cookie("accessToken", tokenSet.access_token, secureCookieConfig)
            .cookie("refreshToken", tokenSet.refresh_token, secureCookieConfig)
            .cookie("idToken", tokenSet.id_token, secureCookieConfig)
            .clearCookie("state")
            .clearCookie("nonce")
            .redirect("/home");
    });

    app.get("/home", checkLoggedIn, (req, res) => {
        const userData = req.signedCookies.userData;

        // Construct the HTML response with user information from the userData cookie
        res.send(getHomeHtml(userData));
    });

    // Start the server
    app.listen(port, () => {
        console.log(`Server is running on port: ${port}`);
    });
}

main().catch(console.error);
