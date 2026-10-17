import type { HormonalProtocol } from './model';

// Plano informado pelo usuário. Não representa administrações realizadas.
export const INFORMED_HORMONAL_PLAN: HormonalProtocol = {
  "name": "Registro hormonal informado",
  "weeks": 12,
  "entries": [
    {
      "id": "testosterona-segunda",
      "substance": "Enantato de testosterona",
      "doseMg": 250,
      "frequency": "weekly",
      "weekday": 1,
      "fromWeek": 1,
      "toWeek": 12
    },
    {
      "id": "testosterona-segundo-dia",
      "substance": "Enantato de testosterona",
      "doseMg": 250,
      "frequency": "weekly",
      "weekday": null,
      "fromWeek": 1,
      "toWeek": 12
    },
    {
      "id": "nandrolona-segunda",
      "substance": "Decanoato de nandrolona",
      "doseMg": 200,
      "frequency": "weekly",
      "weekday": 1,
      "fromWeek": 1,
      "toWeek": 12
    },
    {
      "id": "nandrolona-segundo-dia",
      "substance": "Decanoato de nandrolona",
      "doseMg": 200,
      "frequency": "weekly",
      "weekday": null,
      "fromWeek": 1,
      "toWeek": 12
    },
    {
      "id": "trembolona-segunda",
      "substance": "Enantato de trembolona",
      "doseMg": 100,
      "frequency": "weekly",
      "weekday": 1,
      "fromWeek": 1,
      "toWeek": 12
    },
    {
      "id": "oximetolona-oral",
      "substance": "Oximetolona oral",
      "doseMg": 50,
      "frequency": "daily",
      "weekday": null,
      "fromWeek": 1,
      "toWeek": 8
    }
  ]
};
