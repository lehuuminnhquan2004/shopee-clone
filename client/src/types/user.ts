export type User={
    id:string;
    email:string|null;
    phone:string|null;
    username:string;
    role:'buyer' | 'seller' | 'admin';
}