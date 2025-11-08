// src/modules/contact/types.ts

export type Contact = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  title: string;
  content: string;
  createdAt?: string;
};

export type ContactList = {
  items: Contact[];
};
