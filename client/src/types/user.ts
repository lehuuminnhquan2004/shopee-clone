export type User={
    id:string;
    email:string|null;
    phone:string|null;
    username:string;
    avatarUrl:string|null;
    role:'buyer' | 'seller' | 'admin';
}

export type Gender = "male" | "female" | "other";

export type UserProfile = User & {
    fullName: string | null;
    gender: Gender | null;
    birthDate: string | null; // YYYY-MM-DD
};

export type MeResponse = {
    user: UserProfile;
};
