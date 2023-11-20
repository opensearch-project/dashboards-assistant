# `registerMessageParser` — Register your customized parser logic into Chatbot.

**Interaction** refers to a question-answer pair in Chatbot application. In most cases, an interaction consists of two messages: an `Input` message and an `Output` message. However, as the Chatbot evolves to become more powerful, it may display new messages such as visualizations, data explorers, or data grids. Therefore, it is crucial to implement a mechanism that allows other plugins to register their customized parser logic based on each interaction body.


## API

### registerMessageParser

```
dashboardAssistant.registerMessageParser({
    id: "foo_parser",
    parserProvider: async (interaction, messageParserHelper) => {
        if (interaction.additional_info?.visualizationId) {
            messageParserHelper.addMessage({
                contentType: "visualization",
                content: interaction.additional_info.visualizationId
            })
        }
    }
})
```
