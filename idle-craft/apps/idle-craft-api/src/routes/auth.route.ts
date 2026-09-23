import { ExpressAuth } from "@auth/express"
import { Express } from 'express';
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import Google from "@auth/express/providers/google"
import Credentials from "@auth/express/providers/credentials";
import client, { getUserFromDb } from "../lib/db";
import { saltAndHashPassword } from "../lib/utils";

export const expressAuthConfig = { 
    providers: [ 
        Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }), 
        Credentials({
            credentials: {
                email: { label: "Email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                let user = null

                if (!credentials.password || !credentials.email) throw AuthMissingCredentialsError();
                let email = credentials.email as string;
                let password = credentials.password as string;
    
                // logic to salt and hash password
                const pwHash = saltAndHashPassword(password);
    
                // logic to verify if the user exists
                user = await getUserFromDb(email, pwHash);
    
                if (!user) {
                    // No user found, so this is their first attempt to login
                    // Optionally, this is also the place you could do a user registration
                    throw AuthInvalidCredentialsError();
                }
    
                // return user object with the their profile data
                return user;
            },
        }),
    ],
    adapter: MongoDBAdapter(client),
};

export function auth(app: Express) {

    //setup auth.js
    app.set('trust proxy', true);
    app.use("/auth/*", ExpressAuth(expressAuthConfig));
}
 