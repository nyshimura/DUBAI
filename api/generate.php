<?php
// IMPORTANT: Rename this file to generate.php and place it on a PHP-enabled server.

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Function to send a JSON error response
function send_error($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode(['error' => $message]);
    exit;
}

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Invalid request method. Only POST is accepted.', 405);
}

// Get the API key from environment variables for security
$apiKey = "SUA-CHAVE"; // <-- COLE SUA CHAVE AQUI DENTRO DAS ASPAS
if (!$apiKey) {
    send_error("API key not configured on the server.", 500);
}

// Get the JSON payload from the request
$input = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE || !isset($input['description']) || empty(trim($input['description']))) {
    send_error('Invalid JSON payload or missing description.');
}
$description = $input['description'];

/**
 * Calls the Google Gemini API.
 *
 * @param string $prompt The prompt to send to the model.
 * @param string $apiKey Your API key.
 * @return array The decoded JSON response from the API.
 * @throws Exception If the API call fails or returns an error.
 */
function call_gemini_api($prompt, $apiKey) {
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $apiKey; // <-- COLE SEU CURL DA SUA IA, NAO TESTEI COM OUTRAS APENAS COM GEMINI
    $data = [
        'contents' => [
            [
                'parts' => [
                    ['text' => $prompt]
                ]
            ]
        ]
    ];
    $payload = json_encode($data);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new Exception("cURL Error: " . $curlError);
    }
    
    if ($httpCode >= 400) {
        $errorDetails = json_decode($response, true);
        $errorMessage = $errorDetails['error']['message'] ?? 'Unknown API error';
        if (strpos($errorMessage, 'API key not valid') !== false) {
             throw new Exception('Chave de API inválida. Verifique sua configuração no servidor.');
        }
        throw new Exception("API Error (HTTP {$httpCode}): " . $errorMessage, $httpCode);
    }

    $decoded_response = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Failed to decode API response JSON.");
    }

    if (!isset($decoded_response['candidates'][0]['content']['parts'][0]['text'])) {
        // Handle cases where the model might refuse to answer
        if (isset($decoded_response['candidates'][0]['finishReason']) && $decoded_response['candidates'][0]['finishReason'] !== 'STOP') {
             throw new Exception("A geração foi interrompida pela API. Motivo: " . $decoded_response['candidates'][0]['finishReason']);
        }
        throw new Exception("Unexpected API response format. Could not find generated text.");
    }
    
    $text_content = $decoded_response['candidates'][0]['content']['parts'][0]['text'];
    $clean_json_text = trim(str_replace(['```json', '```'], '', $text_content));
    
    $final_data = json_decode($clean_json_text, true);
     if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Failed to decode the JSON content from the model's text response. Error: " . json_last_error_msg());
    }

    return $final_data;
}

try {
    // Step 1: Generate Initial Structure
    $structurePrompt = "Você é um arquiteto de software sênior. Sua tarefa é analisar a descrição de um sistema e extrair seus componentes principais em um formato JSON estruturado.\nA resposta DEVE ser inteiramente em português do Brasil (exceto por termos técnicos como 'attributes', 'methods', etc. que devem permanecer em inglês no schema).\n\nDescrição do Sistema: \"{$description}\"\n\nCom base na descrição, gere um design de sistema detalhado que siga estritamente o seguinte schema JSON:\n{\n  \"systemName\": \"(Nome do sistema)\",\n  \"actors\": [{\"id\": \"ATOR_ID\", \"name\": \"Nome do Ator\"}],\n  \"useCases\": [{\"id\": \"UC_ID\", \"name\": \"Nome do Caso de Uso\"}],\n  \"classes\": [{\"id\": \"CLASSE_ID\", \"name\": \"NomeDaClasse\", \"attributes\": [\"+ atributo: tipo\"], \"methods\": [\"+ metodo(param): tipoRetorno\"]}],\n  \"relationships\": [\n    {\"source\": \"ID_Origem\", \"target\": \"ID_Destino\", \"type\": \"usage\"},\n    {\"source\": \"ID_Origem\", \"target\": \"ID_Destino\", \"type\": \"association\"},\n    {\"source\": \"ID_Origem\", \"target\": \"ID_Destino\", \"type\": \"aggregation\"},\n    {\"source\": \"ID_Origem\", \"target\": \"ID_Destino\", \"type\": \"composition\"},\n    {\"source\": \"ID_Origem\", \"target\": \"ID_Destino\", \"type\": \"generalization\"}\n  ]\n}\n\nREGRAS IMPORTANTES:\n1. Os IDs devem ser curtos, descritivos e únicos (ex: ATOR_CLIENTE, UC_LOGIN, CLASSE_CONTA).\n2. Todos os relacionamentos devem ter 'source' e 'target' que correspondam a IDs válidos das listas geradas.\n3. Tipos de relacionamento: 'usage' (ator-caso de uso), 'generalization' (herança), 'association'/'aggregation'/'composition' (classe-classe).\n4. Não inclua nenhuma outra propriedade além das especificadas no schema.\n5. Gere como resposta APENAS o JSON, sem nenhum texto adicional, explicações ou marcadores de código como ```json.";
    $initialStructure = call_gemini_api($structurePrompt, $apiKey);
    if (!isset($initialStructure['systemName'])) {
        throw new Exception("A estrutura inicial retornada pela API está vazia ou malformada.");
    }

    // Step 2: Generate Narratives
    $narrativesPrompt = "Você é um escritor técnico especialista em engenharia de software. Sua tarefa é criar narrativas de caso de uso detalhadas, em formato JSON, para a estrutura de sistema fornecida.\nA resposta DEVE ser inteiramente em português do Brasil.\n\nContexto (Estrutura do Sistema):\n" . json_encode($initialStructure) . "\n\nPara cada caso de uso no contexto, gere uma narrativa que siga estritamente o seguinte schema JSON:\n{\n  \"useCaseId\": \"(O UC_ID do contexto)\",\n  \"useCaseName\": \"(O Nome do Caso de Uso)\",\n  \"primaryActor\": \"(O nome do ator principal)\",\n  \"secondaryActors\": [\"(Lista de nomes de atores secundários, se houver)\"],\n  \"priority\": \"High | Medium | Low\",\n  \"briefDescription\": \"(Um resumo conciso do objetivo do caso de uso)\",\n  \"preConditions\": [\"(Condições que devem ser verdadeiras antes do início do fluxo)\"],\n  \"postConditions\": [\"(Condições que serão verdadeiras após a conclusão bem-sucedida do fluxo)\"],\n  \"flowOfEvents\": [\n    {\"step\": 1, \"actorAction\": \"Descrição da ação do ator.\", \"systemResponse\": \"\"},\n    {\"step\": 2, \"actorAction\": \"\", \"systemResponse\": \"Descrição da resposta do sistema.\"}\n  ],\n  \"alternativeFlows\": [\"(Descrição de fluxos alternativos ou de exceção)\"]\n}\n\nREGRAS IMPORTANTES:\n1. O campo 'useCaseId' DEVE corresponder a um ID da lista de casos de uso no contexto.\n2. O 'flowOfEvents' deve ser um diálogo passo a passo. Para cada passo, APENAS 'actorAction' OU 'systemResponse' deve ser preenchido, o outro deve ser uma string vazia.\n3. O fluxo deve alternar logicamente entre as ações do ator e as respostas do sistema.\n4. Gere como resposta APENAS o array JSON, sem nenhum texto adicional, explicações ou marcadores de código como ```json.";
    $narratives = call_gemini_api($narrativesPrompt, $apiKey);

    // Step 3: Generate Requirements
    $requirementsPrompt = "Você é um analista de sistemas experiente. Sua tarefa é derivar requisitos funcionais e não funcionais a partir de um design de sistema detalhado.\nA resposta DEVE ser inteiramente em português do Brasil.\n\nContexto de Design do Sistema:\n" . json_encode(['structure' => $initialStructure, 'narratives' => $narratives]) . "\n\nCom base no contexto completo (estrutura e narrativas), gere uma lista abrangente de requisitos que siga estritamente o seguinte schema JSON:\n{\n  \"functional\": [\n    {\"id\": \"RF-001\", \"description\": \"(Descrição do requisito funcional)\", \"classification\": \"Essencial | Importante | Desejável\"}\n  ],\n  \"nonFunctional\": [\n    {\"id\": \"RNF-001\", \"description\": \"(Descrição do requisito não funcional)\", \"classification\": \"Essencial | Importante | Desejável\"}\n  ]\n}\n\nREGRAS IMPORTANTES:\n1. Derive os requisitos diretamente dos atores, casos de uso, classes e narrativas fornecidos no contexto.\n2. Os IDs devem ser numerados sequencialmente (RF-001, RF-002, RNF-001, etc.).\n3. Gere como resposta APENAS o JSON, sem nenhum texto adicional, explicações ou marcadores de código como ```json.";
    $requirements = call_gemini_api($requirementsPrompt, $apiKey);
    
    // Combine all results and send back to the client
    $systemDesign = array_merge($initialStructure, ['narratives' => $narratives], ['requirements' => $requirements]);
    
    echo json_encode($systemDesign);

} catch (Exception $e) {
    $statusCode = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    send_error("Erro no processo de geração: " . $e->getMessage(), $statusCode);
}
?>