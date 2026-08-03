package com.plotweaver.plotweaver_api.config;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI plotWeaverOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("PlotWeaver API")
                        .description("Documentation de l'API REST pour PlotWeaver")
                        .version("v1.0.0")
                        .contact(new Contact().name("PlotWeaver Team")));
    }

    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("api-plotweaver")
                .packagesToScan("com.plotweaver.plotweaver_api.modules")
                .build();
    }
}