import logging
import azure.functions as func
from gas_blender import Gas, TrimixBlend


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    start_bar = start_o2 = start_he = None
    finish_bar = finish_o2 = finish_he = None
    helium_bar = helium_o2 = helium_he = None

    try:
        req_body = req.get_json()
        start_bar = req_body.get('start_bar')
        start_o2 = req_body.get('start_o2')
        start_he = req_body.get('start_he')
        finish_bar = req_body.get('finish_bar')
        finish_o2 = req_body.get('finish_o2')
        finish_he = req_body.get('finish_he')
        helium_bar = req_body.get('helium_bar')
        helium_o2 = req_body.get('helium_o2')
        helium_he = req_body.get('helium_he')
    except ValueError:
        return func.HttpResponse("Request body must be valid JSON.", status_code=400)

    required = [start_bar, start_o2, start_he, finish_bar, finish_o2, finish_he]
    if any(v is None for v in required):
        return func.HttpResponse(
            "Missing required parameters: start_bar, start_o2, start_he, finish_bar, finish_o2, finish_he.",
            status_code=400
        )

    start_gas = Gas(start_bar, start_o2, start_he)
    finish_gas = Gas(finish_bar, finish_o2, finish_he)

    if helium_bar is not None and helium_o2 is not None and helium_he is not None:
        helium_gas = Gas(helium_bar, helium_o2, helium_he)
    else:
        helium_gas = Gas(250, 0, 100)

    try:
        result = TrimixBlend(start_gas, finish_gas, helium_gas)
    except (ValueError, ZeroDivisionError) as e:
        return func.HttpResponse(str(e), status_code=400)

    return func.HttpResponse(result.toJSON(), mimetype="application/json")
