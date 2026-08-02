package com.plotweaver.plotweaver_api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI plotWeaverOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("PlotWeaver API")
                        .description("Documentation de l'API REST pour l'application d'écriture PlotWeaver")
                        .version("v0.0.1"));
    }
}