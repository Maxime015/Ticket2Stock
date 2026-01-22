import easyocr
import json

class OcrModule:
    def __init__(self):
        self.data = {
            "shop": {
                "name": "",
                "address": "",
                "nb_article": "",
                "date": "",
                "phone": "",
                "siret": ""
            },
            "articles": []
        }
        self.__reader = easyocr.Reader(['fr'])

    def extract_data_from_ticket(self, image_path):
        results = self.__scan(image_path)
        for (bbox, text, prob) in results:
            text = text.strip()
            
            if any(char.isdigit() for char in text):
                # Si le texte contient un chiffre, il pourrait s'agir d'un prix
                try:
                    price = float(text.replace('€', '').replace(',', '.'))
                    if self.data["articles"]:
                        self.data["articles"][-1]["price"] = price
                        self.data["articles"][-1]["fiability"] = prob
                except ValueError:
                    pass
            else:
                # Sinon, il s'agit probablement d'un nom d'article
                self.data["articles"].append({
                    "label": text,
                    "price": None,
                    "fiability": prob
                })
        print(results)
        return results

    def __scan(self, image_path):
        result = self.__reader.readtext(image_path)
        print(result)
        return result

    def formatToJson(self):
        self.data["shop"]["address"] = self.data["shop"]["address"].strip()
        # Convertir en JSON
        json_data = json.dumps(self.data, indent=4, ensure_ascii=False)
        return json_data

    def save(self):
        # Sauvegarder les résultats dans un fichier JSON
        json_data = self.formatToJson()
        with open('ticket_data.json', 'w', encoding='utf-8') as f:
            f.write(json_data)




















