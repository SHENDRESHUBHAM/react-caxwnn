import React from "react";
import ReactDOM from "react-dom";
import { Chat, HeroCard } from "@progress/kendo-react-conversational-ui";
import { DirectLine } from "botframework-directlinejs";
import * as AdaptiveCards from "adaptivecards";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { messages: [] };
    this.client = new DirectLine({
      secret: "Y_ly-If6haE.cwA.PQE.ZwOOsq4MlHcD3_YLFI-t9oW6L6DXMMBoi67LBz9WaWA"
    });
    this.client.activity$.subscribe(activity => this.onResponse(activity));
    this.user = {
      id: "User"
    };
    this.bot = {
      id: "Botyo-BotTesting",
      name: "Travel Agent",
      avatarUrl:
        "https://demos.telerik.com/kendo-ui/content/chat/VacationBot.png"
    };
    this.addNewMessage = this.addNewMessage.bind(this);
  }

  аttachmentTemplate = props => {
    let attachment = props.item;
    if (attachment.contentType === "application/vnd.microsoft.card.hero") {
      return (
        <HeroCard
          title={attachment.content.title || attachment.content.text}
          subtitle={attachment.content.subtitle}
          imageUrl={
            attachment.content.images ? attachment.content.images[0].url : ""
          }
          imageMaxWidth="250px"
          actions={attachment.content.buttons}
          onActionExecute={this.addNewMessage}
        />
      );
    } else if (
      attachment.contentType === "application/vnd.microsoft.card.adaptive"
    ) {
      let adaptiveCard = new AdaptiveCards.AdaptiveCard();
      adaptiveCard.parse(attachment.content);
      let renderedCard = adaptiveCard.render();
      let htmlToinsert = { __html: renderedCard.innerHTML };
      return <div dangerouslySetInnerHTML={htmlToinsert} />;
    } else {
      return <div className="k-card">{attachment.content}</div>;
    }
  };

  parseActions = actions => {
    if (actions !== undefined) {
      actions.actions.map(action => {
        if (action.type === "imBack") {
          action.type = "reply";
        }
      });
      return actions.actions;
    }
    return [];
  };

  parseText = event => {
    if (event.action !== undefined) {
      return event.action.value;
    } else if (event.value) {
      return event.value;
    } else {
      return event.message.text;
    }
  };

  onResponse = activity => {
    let newMsg;
    if (activity.from.id === this.bot.id) {
      newMsg = {
        text: activity.text,
        author: this.bot,
        typing: activity.type === "typing",
        timestamp: new Date(activity.timestamp),
        suggestedActions: this.parseActions(activity.suggestedActions),
        attachments: activity.attachments ? activity.attachments : []
      };

      this.setState(prevState => {
        return { messages: [...prevState.messages, newMsg] };
      });
    }
  };

  addNewMessage = event => {
    let value = this.parseText(event);
    this.client
      .postActivity({
        from: { id: this.user.id, name: this.user.name },
        type: "message",
        text: value
      })
      .subscribe(
        id => console.log("Posted activity, assigned ID ", id),
        error => console.log("Error posting activity", error)
      );
    if (!event.value) {
      this.setState(prevState => {
        return {
          messages: [
            ...prevState.messages,
            { author: this.user, text: value, timestamp: new Date() }
          ]
        };
      });
    }
  };

  render() {
    return (
      <Chat
        messages={this.state.messages}
        user={this.user}
        onMessageSend={this.addNewMessage}
        attachmentTemplate={this.аttachmentTemplate}
      />
    );
  }
}

ReactDOM.render(<App />, document.querySelector("my-app"));
