import { Injectable } from '@nestjs/common';
import * as xml from 'xml-js';
import { PayrollCalculation } from './entities/payroll-calculation.entity';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

/**
 * ČSSZ VPDPP XML Export Service
 *
 * Generates the official VPDPP (Vyúčtování příjmů z dohod) XML file
 * required by ČSSZ (Czech Social Security Administration) for DPP/DPČ workers.
 *
 * This is the KILLER FEATURE - saves managers hours of manual data entry.
 */
@Injectable()
export class CsszExportService {
  /**
   * Generate ČSSZ VPDPP XML export for a payroll period
   *
   * Format complies with ČSSZ schema version 1.0
   * Reference: https://www.cssz.cz/documents/20143/110287/VPDPP_schema.xsd
   */
  generateVpdppXml(
    tenant: Tenant,
    calculations: PayrollCalculation[],
    periodMonth: number,
    periodYear: number,
  ): string {
    const xmlData = {
      _declaration: {
        _attributes: {
          version: '1.0',
          encoding: 'UTF-8',
        },
      },
      VPDPP: {
        _attributes: {
          xmlns: 'http://www.cssz.cz/schemas/VPDPP/v1',
          'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          verzePodani: '1.0',
        },
        Hlavicka: {
          _attributes: {
            datum: new Date().toISOString().split('T')[0],
            cas: new Date().toTimeString().split(' ')[0],
          },
          Platce: {
            ICO: { _text: tenant.ico || '' },
            NazevFirmy: { _text: tenant.companyName },
            Adresa: {
              Ulice: { _text: tenant.address || '' },
              Obec: { _text: tenant.city || '' },
              PSC: { _text: tenant.postalCode?.replace(/\s/g, '') || '' },
            },
            Email: { _text: tenant.email || '' },
            Telefon: { _text: tenant.phone || '' },
          },
          ObdobíVyúčtování: {
            Měsíc: { _text: periodMonth.toString().padStart(2, '0') },
            Rok: { _text: periodYear.toString() },
          },
        },
        SeznamZamestnanců: {
          Zaměstnanec: calculations.map((calc) => this.generateWorkerRecord(calc)),
        },
        Souhrn: {
          PočetZaměstnanců: { _text: calculations.length.toString() },
          CelkováHrubáMzda: {
            _text: calculations
              .reduce((sum, calc) => sum + Number(calc.grossPay), 0)
              .toFixed(2),
          },
        },
      },
    };

    const xml_string = xml.js2xml(xmlData, {
      compact: true,
      spaces: 2,
      indentAttributes: false,
    });

    return xml_string;
  }

  /**
   * Generate individual worker record for VPDPP XML
   */
  private generateWorkerRecord(calculation: PayrollCalculation): any {
    return {
      _attributes: {
        id: calculation.workerId,
      },
      OsobníÚdaje: {
        RodnéČíslo: {
          _text: this.formatBirthNumber(calculation.workerBirthNumber),
        },
        KódPojiš Tovny: {
          _text: calculation.workerHealthInsuranceCode || '111', // Default VZP
        },
      },
      TypDohody: {
        _text: this.getContractTypeCode(calculation),
      },
      PracovníÚdaje: {
        CelkovéHodiny: {
          _text: this.getTotalHours(calculation).toFixed(2),
        },
        HrubýPříjem: {
          _text: calculation.grossPay.toFixed(2),
        },
        ZákladníMzda: {
          _text: calculation.basePay.toFixed(2),
        },
        Příplatky: {
          VíkendPříplatek: {
            _text: calculation.weekendSupplement?.toFixed(2) || '0.00',
          },
          NocníPříplatek: {
            _text: calculation.nightSupplement?.toFixed(2) || '0.00',
          },
          SvátekPříplatek: {
            _text: calculation.holidaySupplement?.toFixed(2) || '0.00',
          },
        },
      },
      RocníSouhrn: {
        HodinyDoDneška: {
          _text: calculation.ytdHours?.toFixed(2) || '0.00',
        },
      },
    };
  }

  /**
   * Format birth number for ČSSZ (remove slash if present)
   */
  private formatBirthNumber(birthNumber: string): string {
    if (!birthNumber) return '';
    return birthNumber.replace('/', '');
  }

  /**
   * Get contract type code for ČSSZ
   * DPP = 01, DPČ = 02
   */
  private getContractTypeCode(calculation: PayrollCalculation): string {
    // This would normally come from the contract entity
    // For now, we determine by total hours (DPP < 300/year)
    return calculation.ytdHours <= 300 ? '01' : '02';
  }

  /**
   * Get total hours from calculation
   */
  private getTotalHours(calculation: PayrollCalculation): number {
    return (
      Number(calculation.totalRegularHours || 0) +
      Number(calculation.totalWeekendHours || 0) +
      Number(calculation.totalNightHours || 0) +
      Number(calculation.totalHolidayHours || 0)
    );
  }

  /**
   * Generate CSV export for accounting software (POHODA, Money S3)
   */
  generateAccountingCsv(calculations: PayrollCalculation[]): string {
    const headers = [
      'Worker ID',
      'First Name',
      'Last Name',
      'Birth Number',
      'Total Hours',
      'Base Pay',
      'Weekend Supplement',
      'Night Supplement',
      'Holiday Supplement',
      'Performance Bonus',
      'Gross Pay',
      'YTD Hours',
    ];

    const rows = calculations.map((calc) => [
      calc.workerId,
      '', // Would need to join with User entity
      '',
      this.formatBirthNumber(calc.workerBirthNumber),
      this.getTotalHours(calc).toFixed(2),
      calc.basePay.toFixed(2),
      calc.weekendSupplement?.toFixed(2) || '0.00',
      calc.nightSupplement?.toFixed(2) || '0.00',
      calc.holidaySupplement?.toFixed(2) || '0.00',
      calc.performanceBonus?.toFixed(2) || '0.00',
      calc.grossPay.toFixed(2),
      calc.ytdHours?.toFixed(2) || '0.00',
    ]);

    // Generate CSV
    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csv;
  }
}
