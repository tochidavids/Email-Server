document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');

    // Submit email
    document.querySelector('#compose-form').addEventListener('submit', submitEmail)
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#single-email').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

}

function submitEmail(event) {
    // prevent default form submission
    event.preventDefault();

    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
        }),
        // make sure the server knows this is a JSON body
        headers: { 'Content-Type': 'application/json' },
    })
        .then(response => response.json())
        .then(result => {
            // Print result
            console.log(result);
        }).catch(error => {
            console.log('Error: idk something happened', error);
        });

    load_mailbox('sent')

    // return false
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#single-email').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Get emails for each mailbox

    // Inbox emails
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(items => items.sort())
        .then(emails => {
            // Print emails
            console.log(emails);

            // Show emails
            emails.forEach(i => {
                // able to use info about the email
                const parsed = JSON.parse(JSON.stringify(i))
                // making new div
                const element = document.createElement('div');
                element.classList.add('email')
                // sender
                sender1 = parsed.sender
                str_list = sender1.split('@')
                sender2 = str_list[0]

                // what is shown in the div
                element.insertAdjacentHTML(
                    'afterbegin',
                    `<div class='left-email'>
                    <strong>${sender2}</strong>
                    <p class='subject'>${parsed.subject}</p>
                    </div>
                    <p class='time'>${parsed.timestamp}</p>`
                )

                // clicked
                element.addEventListener('click', function () {
                    console.log('This element has been clicked!')
                    // make read
                    fetch(`/emails/${parsed.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            read: true
                        })
                    })
                    view_email(i)
                });
                document.querySelector('#emails-view').append(element);

                if (parsed.read === true) {
                    element.style.backgroundColor = '#C3C3C3'
                    element.style.borderBottomColor = '#000'
                } else {
                    element.style.backgroundColor = '#fff'
                }
            })

        });
}

function view_email(email) {
    const parsed = JSON.parse(JSON.stringify(email))

    fetch(`/emails/${parsed.id}`)
        .then(response => response.json())
        .then(email => {
            // Print email
            console.log(email);

            // Hide over views
            document.querySelector('#emails-view').style.display = 'none';
            document.querySelector('#compose-view').style.display = 'none';
            document.querySelector('#single-email').style.display = 'block';

            // Show email info
            const div = document.querySelector('#single-email')

            div.innerHTML = ''

            div.insertAdjacentHTML(
                'afterbegin',
                `<div class='top'>
                <p><strong>From: </strong> ${parsed.sender} </p>
                <p><strong>To: </strong> ${parsed.recipients.join(', ')} </p>
                <p><strong>Timestamp: </strong> ${parsed.timestamp} </p>
                </div>
                <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>`
            )
            document.querySelector('#reply').addEventListener('click', () => reply(email))
            const get_user = document.querySelector('#user')
            user = get_user.innerText
            // console.log(user)
            if (parsed.sender != user) {
                if (parsed.archived === false) {
                    div.insertAdjacentHTML(
                        'beforeend',
                        `<button class="btn btn-sm btn-outline-primary" id="archive">Archive</button>`
                    )
                } else {
                    div.insertAdjacentHTML(
                        'beforeend',
                        `<button class="btn btn-sm btn-outline-primary" id="archive">Unarchive</button>`
                    )
                }
                document.querySelector('#archive').addEventListener('click', () => archive(email))
            }

            div.insertAdjacentHTML(
                'beforeend',
                `<hr>
                <h3>${parsed.subject}</h3>
                <p class='body'>${parsed.body}</p>
                `
            )
        })
};

function archive(email) {
    const parsed = JSON.parse(JSON.stringify(email))

    if (parsed.archived === false) {
        fetch(`/emails/${parsed.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: true
            })
        })
        console.log('archived')
    } else {
        fetch(`/emails/${parsed.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: false
            })
        })
        console.log('unarchived')
    }

    load_mailbox('inbox')
}

function reply(email) {
    const parsed = JSON.parse(JSON.stringify(email))

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#single-email').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = `${parsed.sender}`;
    if (parsed.subject.includes('Re')) {
        document.querySelector('#compose-subject').value = `${parsed.subject}`;
    } else {
        document.querySelector('#compose-subject').value = `Re: ${parsed.subject}`;
    }
    document.querySelector('#compose-body').value = `On ${parsed.timestamp}, ${parsed.sender} wrote: ${parsed.body}`;
}