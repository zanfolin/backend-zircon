import { cpf, cnpj } from 'cpf-cnpj-validator';

export const validationService = {
  validateCPF(cpfNumber) {
    const cleaned = cpfNumber.replace(/\D/g, '');
    return cpf.isValid(cleaned);
  },

  validateCNPJ(cnpjNumber) {
    const cleaned = cnpjNumber.replace(/\D/g, '');
    return cnpj.isValid(cleaned);
  },

  validateDocument(documentType, documentNumber) {
    switch (documentType) {
      case 'CPF':
        return this.validateCPF(documentNumber);
      case 'CNPJ':
        return this.validateCNPJ(documentNumber);
      case 'Passaporte':
        // Passport validation - basic format check
        return documentNumber.length >= 6 && documentNumber.length <= 20;
      default:
        return false;
    }
  },

  formatCPF(cpfNumber) {
    const cleaned = cpfNumber.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpfNumber;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  formatCNPJ(cnpjNumber) {
    const cleaned = cnpjNumber.replace(/\D/g, '');
    if (cleaned.length !== 14) return cnpjNumber;
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  },

  formatDocument(documentType, documentNumber) {
    switch (documentType) {
      case 'CPF':
        return this.formatCPF(documentNumber);
      case 'CNPJ':
        return this.formatCNPJ(documentNumber);
      default:
        return documentNumber;
    }
  },

  getDocumentTypeFromNumber(documentNumber) {
    const cleaned = documentNumber.replace(/\D/g, '');
    if (cleaned.length === 11) return 'CPF';
    if (cleaned.length === 14) return 'CNPJ';
    return 'Passaporte';
  },
};