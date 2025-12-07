package com.sqli.workshop.ddd.connaissance.client.generated.codepostal.client;

import com.sqli.workshop.ddd.connaissance.client.generated.codepostal.ApiClient;

import com.sqli.workshop.ddd.connaissance.client.generated.codepostal.model.Commune;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@jakarta.annotation.Generated(value = "org.openapitools.codegen.languages.JavaClientCodegen", date = "2025-12-07T07:50:03.908633171Z[Etc/UTC]")
public class CodesPostauxApi {
    private ApiClient apiClient;

    public CodesPostauxApi() {
        this(new ApiClient());
    }

    public CodesPostauxApi(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public ApiClient getApiClient() {
        return apiClient;
    }

    public void setApiClient(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * 
     * Renvoie les communes correspondant à un code postal
     * <p><b>200</b> - Success
     * @param codePostal Code postal de la commune. (required)
     * @return List&lt;Commune&gt;
     * @throws RestClientException if an error occurs while attempting to invoke the API
     */
    public List<Commune> codesPostauxCommunesCodePostalGet(String codePostal) throws RestClientException {
        return codesPostauxCommunesCodePostalGetWithHttpInfo(codePostal).getBody();
    }

    /**
     * 
     * Renvoie les communes correspondant à un code postal
     * <p><b>200</b> - Success
     * @param codePostal Code postal de la commune. (required)
     * @return ResponseEntity&lt;List&lt;Commune&gt;&gt;
     * @throws RestClientException if an error occurs while attempting to invoke the API
     */
    public ResponseEntity<List<Commune>> codesPostauxCommunesCodePostalGetWithHttpInfo(String codePostal) throws RestClientException {
        Object localVarPostBody = null;
        
        // verify the required parameter 'codePostal' is set
        if (codePostal == null) {
            throw new HttpClientErrorException(HttpStatus.BAD_REQUEST, "Missing the required parameter 'codePostal' when calling codesPostauxCommunesCodePostalGet");
        }
        
        // create path and map variables
        final Map<String, Object> uriVariables = new HashMap<String, Object>();
        uriVariables.put("codePostal", codePostal);

        final MultiValueMap<String, String> localVarQueryParams = new LinkedMultiValueMap<String, String>();
        final HttpHeaders localVarHeaderParams = new HttpHeaders();
        final MultiValueMap<String, String> localVarCookieParams = new LinkedMultiValueMap<String, String>();
        final MultiValueMap<String, Object> localVarFormParams = new LinkedMultiValueMap<String, Object>();

        final String[] localVarAccepts = { 
            "application/json"
         };
        final List<MediaType> localVarAccept = apiClient.selectHeaderAccept(localVarAccepts);
        final String[] localVarContentTypes = {  };
        final MediaType localVarContentType = apiClient.selectHeaderContentType(localVarContentTypes);

        String[] localVarAuthNames = new String[] {  };

        ParameterizedTypeReference<List<Commune>> localReturnType = new ParameterizedTypeReference<List<Commune>>() {};
        return apiClient.invokeAPI("/codes-postaux/communes/{codePostal}", HttpMethod.GET, uriVariables, localVarQueryParams, localVarPostBody, localVarHeaderParams, localVarCookieParams, localVarFormParams, localVarAccept, localVarContentType, localVarAuthNames, localReturnType);
    }
}
