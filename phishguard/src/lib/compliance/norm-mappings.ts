/**
 * Norm mappings: Associates training modules with compliance controls
 * ISO-27001, SOC2, LGPD
 */

import type { NormControl, NormMapping } from './types';

export const ISO_27001_CONTROLS: NormControl[] = [
  {
    id: 'ISO-A.5.1.1',
    framework: 'ISO-27001',
    controlCode: 'A.5.1.1',
    description: 'Information security policies',
    requirement: 'Policies for information security shall be defined, approved by management, published and communicated to employees and relevant external parties.',
  },
  {
    id: 'ISO-A.7.2.2',
    framework: 'ISO-27001',
    controlCode: 'A.7.2.2',
    description: 'Information security awareness, education and training',
    requirement: 'All employees of the organization and, where relevant, other workers shall receive appropriate information security awareness education and training.',
  },
  {
    id: 'ISO-A.8.2.1',
    framework: 'ISO-27001',
    controlCode: 'A.8.2.1',
    description: 'Management of technical vulnerabilities',
    requirement: 'Information about technical vulnerabilities of information systems shall be obtained, and the organization\'s exposure to such vulnerabilities shall be evaluated.',
  },
  {
    id: 'ISO-A.12.2.1',
    framework: 'ISO-27001',
    controlCode: 'A.12.2.1',
    description: 'Protection from malware',
    requirement: 'Detection, prevention and recovery controls to protect against malware shall be implemented.',
  },
  {
    id: 'ISO-A.16.1.1',
    framework: 'ISO-27001',
    controlCode: 'A.16.1.1',
    description: 'Incident management',
    requirement: 'Management responsibilities and procedures shall be established to ensure effective response to incidents.',
  },
];

export const SOC2_CONTROLS: NormControl[] = [
  {
    id: 'SOC2-CC2.1',
    framework: 'SOC2',
    controlCode: 'CC2.1',
    description: 'Information and Communication',
    requirement: 'The entity obtains or generates and uses relevant and quality information to support the functioning of internal control.',
  },
  {
    id: 'SOC2-CC6.6',
    framework: 'SOC2',
    controlCode: 'CC6.6',
    description: 'Security for confidential and sensitive info',
    requirement: 'The entity implements measures to protect confidential information from unauthorized access and disclosure.',
  },
  {
    id: 'SOC2-CC8.1',
    framework: 'SOC2',
    controlCode: 'CC8.1',
    description: 'Change management',
    requirement: 'The entity authorizes, designs, develops, configures, tests, approves, and implements changes to infrastructure, data, software, and procedures.',
  },
  {
    id: 'SOC2-CC9.2',
    framework: 'SOC2',
    controlCode: 'CC9.2',
    description: 'Risk mitigation',
    requirement: 'The entity identifies and selects risk mitigation actions to achieve risk objectives.',
  },
];

export const LGPD_CONTROLS: NormControl[] = [
  {
    id: 'LGPD-art.7',
    framework: 'LGPD',
    controlCode: 'Art. 7º',
    description: 'Legal basis for processing',
    requirement: 'Processing of personal data shall be carried out with the consent of the holder or other legal bases provided in this Law.',
  },
  {
    id: 'LGPD-art.8',
    framework: 'LGPD',
    controlCode: 'Art. 8º',
    description: 'Data processing consent',
    requirement: 'The consent must be free, informed and unambiguous, and may be withdrawn at any time.',
  },
  {
    id: 'LGPD-art.10',
    framework: 'LGPD',
    controlCode: 'Art. 10º',
    description: 'Legitimate interest',
    requirement: 'The legitimate interest of the controller may be used as a basis for processing when it does not override the fundamental rights and freedoms of the holder.',
  },
  {
    id: 'LGPD-art.48',
    framework: 'LGPD',
    controlCode: 'Art. 48º',
    description: 'Security incidents notification',
    requirement: 'The controller must communicate to the national authority and to the holder the occurrence of a security incident that may cause risk or harm to the holders.',
  },
  {
    id: 'LGPD-art.46',
    framework: 'LGPD',
    controlCode: 'Art. 46º',
    description: 'Use of security measures',
    requirement: 'The controller must adopt security measures, technical and administrative that are able to protect personal data from unauthorized access and accidental or illegal destruction.',
  },
];

export const ALL_CONTROLS = [
  ...ISO_27001_CONTROLS,
  ...SOC2_CONTROLS,
  ...LGPD_CONTROLS,
];

/**
 * Training module to norm mappings
 * Each module is mapped to 2-3 relevant controls
 */
export const TRAINING_NORM_MAPPINGS: NormMapping[] = [
  {
    moduleId: 'mod-intro-phishing',
    moduleName: 'Introdução ao Phishing',
    norms: [
      ISO_27001_CONTROLS[1], // A.7.2.2 awareness training
      SOC2_CONTROLS[0], // CC2.1 information and communication
      LGPD_CONTROLS[0], // Art.7 legal basis
    ],
  },
  {
    moduleId: 'mod-senhas-seguras',
    moduleName: 'Senhas Seguras',
    norms: [
      ISO_27001_CONTROLS[0], // A.5.1.1 policies
      SOC2_CONTROLS[1], // CC6.6 confidential info protection
      LGPD_CONTROLS[4], // Art.46 security measures
    ],
  },
  {
    moduleId: 'mod-lgpd-fundamentos',
    moduleName: 'LGPD para Funcionários',
    norms: [
      LGPD_CONTROLS[0], // Art.7 legal basis
      LGPD_CONTROLS[1], // Art.8 consent
      ISO_27001_CONTROLS[1], // A.7.2.2 awareness training
    ],
  },
  {
    moduleId: 'mod-phishing-reconhecer',
    moduleName: 'Phishing: Reconhecer e Reportar',
    norms: [
      ISO_27001_CONTROLS[3], // A.12.2.1 protection from malware
      SOC2_CONTROLS[0], // CC2.1 info and communication
      LGPD_CONTROLS[2], // Art.10 legitimate interest
    ],
  },
  {
    moduleId: 'mod-redes-sociais',
    moduleName: 'Segurança em Redes Sociais',
    norms: [
      SOC2_CONTROLS[1], // CC6.6 confidential info protection
      ISO_27001_CONTROLS[4], // A.16.1.1 incident management
      LGPD_CONTROLS[3], // Art.48 security incidents
    ],
  },
  {
    moduleId: 'mod-dados-pessoais',
    moduleName: 'Dados Pessoais e Privacidade',
    norms: [
      LGPD_CONTROLS[0], // Art.7 legal basis
      LGPD_CONTROLS[1], // Art.8 consent
      SOC2_CONTROLS[3], // CC9.2 risk mitigation
    ],
  },
  {
    moduleId: 'mod-incidentes',
    moduleName: 'Gestion de Incidentes',
    norms: [
      ISO_27001_CONTROLS[4], // A.16.1.1 incident management
      LGPD_CONTROLS[3], // Art.48 security incidents
      SOC2_CONTROLS[3], // CC9.2 risk mitigation
    ],
  },
  {
    moduleId: 'mod-engenharia-social',
    moduleName: 'Engenharia Social',
    norms: [
      ISO_27001_CONTROLS[1], // A.7.2.2 awareness training
      SOC2_CONTROLS[0], // CC2.1 info and communication
      LGPD_CONTROLS[2], // Art.10 legitimate interest
    ],
  },
];

/**
 * Get controls by framework
 */
export function getControlsByFramework(framework: 'ISO-27001' | 'SOC2' | 'LGPD'): NormControl[] {
  return ALL_CONTROLS.filter(c => c.framework === framework);
}

/**
 * Get modules mapped to a specific control
 */
export function getModulesByControl(controlId: string): NormMapping[] {
  return TRAINING_NORM_MAPPINGS.filter(m => m.norms.some(n => n.id === controlId));
}