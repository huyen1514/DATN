import json
import os

with open("d:\\DATN\\JapaneseLearning\\original_exam.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for section in data.get("sections", []):
    for mondai in section.get("mondai_list", []):
        for question in mondai.get("questions", []):
            # Fix options array of strings into array of objects
            if "options" in question and len(question["options"]) > 0 and isinstance(question["options"][0], str):
                new_options = []
                for idx, opt_text in enumerate(question["options"]):
                    new_options.append({
                        "option_id": idx + 1,
                        "text": opt_text
                    })
                question["options"] = new_options
            
            # Fix reading_passage inside question
            if "reading_passage" in question:
                passage = question.pop("reading_passage")
                # Append passage to content with a newline
                question["content"] = passage + "\n\n" + question["content"]

with open("d:\\DATN\\JapaneseLearning\\fixed_exam.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("FIXED")
