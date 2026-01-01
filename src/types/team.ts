export interface TeamMember {
    id: string;
    name: string;
    role: string;
    department: string;
    bio: string;
    image: string;
    socials: {
        linkedin?: string;
        twitter?: string;
        scholar?: string;
        github?: string;
    };
    expertise: string[];
}
