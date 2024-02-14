'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {z} from 'zod';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({id: true, date: true});
const UpdateInvoice = FormSchema.omit({id: true, date: true});

export async function createInvoice(formData:FormData) {
    const {customerId, amount, status}= CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`
            insert into invoice(customer_id, amount, status, date)
            values(${customerId}, ${amountInCents}, ${status}, ${date})
        `
    } catch(error) {
        return {
            message: 'Database Error: Failed to Create Invoice'
        }
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');

    console.log(date);
}

export async function updateInvoice(id: string, formData: FormData) {
    const {customerId, amount, status} = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;

    try {
        await sql `
            update invoices
            set customer_id=${customerId}, amount = ${amountInCents}, status = ${status}
            where id = ${id}
        `;
    } catch(error) {
        return {
            message: 'Database Error: Failed to Create Invoice'
        }
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    throw new Error('Failed to Delete Invoice');
    try {
        await sql`
            delete from invoices where id = ${id}
        `
    } catch(error) {
        return {
            message: 'Database Error: Failed to Create Invoice'
        }
    }
    revalidatePath('/dashboard/invoices');
}