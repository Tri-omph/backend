import { AppDataSource } from '../database/data-source';
import { Customer } from '../models/Customer';

export const incrementCustomerPoints = async (customer: Customer) => {
  try {
    customer.points += 1;
    await AppDataSource.getRepository(Customer).save(customer);
    return customer;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des points:', error);
    throw new Error('Impossible de mettre à jour les points.');
  }
};
