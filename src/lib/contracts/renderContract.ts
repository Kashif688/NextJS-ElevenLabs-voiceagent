import React from 'react';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import { ContractDocument, ContractProps } from '../../components/contracts/ContractDocument';

/**
 * Renders the ContractDocument React TSX component into a PDF Buffer
 */
export async function renderContractPdfBuffer(data: ContractProps): Promise<Buffer> {
  const element = React.createElement(ContractDocument, data) as unknown as React.ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);
  return buffer as Buffer;
}
