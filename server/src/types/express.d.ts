import type { UserRole } from "../generated/prisma/enums.js";

type AuthenticatedUser = {
    id: bigint;
    email: string | null;
    phone: string | null;
    username: string;
    role: UserRole;
};

declare module "express-serve-static-core" {
    interface Request {
        authUser?: AuthenticatedUser;
    }
}