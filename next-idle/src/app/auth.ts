import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import client, { getUserFromDb } from "./lib/db";
import { saltAndHashPassword } from "./lib/utils";

export const { handlers, auth, signIn, signOut } = NextAuth({ 
    providers: [ 
        Google, 
        GitHub,
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
    basePath: "/auth"
});