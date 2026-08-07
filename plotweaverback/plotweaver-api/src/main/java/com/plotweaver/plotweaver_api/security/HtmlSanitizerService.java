package com.plotweaver.plotweaver_api.security;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.stereotype.Service;

@Service
public class HtmlSanitizerService {

    private final PolicyFactory POLICY_FACTORY = new HtmlPolicyBuilder()
        .allowCommonInlineFormattingElements()
        .allowCommonBlockElements()
        .allowElements("h1", "h2", "h3", "ul", "ol", "li")
        .allowUrlProtocols("http", "https")
        .toFactory();

    public String sanitize(String htmlInput) {
        if (htmlInput == null) {
            return null;
        }
        return POLICY_FACTORY.sanitize(htmlInput);
    }
}