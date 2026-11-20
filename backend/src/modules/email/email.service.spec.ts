import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config';
import { contactEmailHtml, EmailService } from './email.service';

const config = (values: Record<string, string>) =>
  ({
    get: (key: string) => values[key.replace('app.', '')],
  }) as unknown as ConfigService<Config>;

const contact = {
  name: '<a href="https://evil.example">Click to verify</a>',
  email: 'visitor@example.com',
  category: '<b>urgent</b>',
  message: '<img src=x onerror=alert(1)>',
};

describe('contactEmailHtml', () => {
  it('escapes every user-supplied value', () => {
    const html = contactEmailHtml(contact);

    expect(html).not.toContain('<a href="https://evil.example">');
    expect(html).not.toContain('<b>urgent</b>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});

describe('EmailService', () => {
  it('logs instead of sending when no Resend key is configured', async () => {
    const service = new EmailService(config({}));
    await expect(
      service.sendVerificationEmail('a@example.com', '123456'),
    ).resolves.toBeUndefined();
    await expect(service.sendContactEmail(contact)).resolves.toBeUndefined();
  });

  it('in production without a key, refuses to send and never logs the code', async () => {
    const logged: string[] = [];
    const record = (message: unknown) => void logged.push(String(message));
    jest.spyOn(Logger.prototype, 'log').mockImplementation(record);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(record);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(record);

    const service = new EmailService(config({ nodeEnv: 'production' }));

    await expect(
      service.sendVerificationEmail('a@example.com', '482913'),
    ).rejects.toThrow(ServiceUnavailableException);
    await expect(service.sendContactEmail(contact)).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(logged.join('\n')).toContain('RESEND_API_KEY is not set');
    expect(logged.join('\n')).not.toContain('482913');
    jest.restoreAllMocks();
  });

  it('sends contact mail to SUPPORT_EMAIL, with the visitor as Reply-To', async () => {
    const service = new EmailService(
      config({
        resendApiKey: 're_test_key',
        resendFromEmail: 'noreply@cognify.test',
        supportEmail: 'help@cognify.test',
      }),
    );
    const send = jest.fn().mockResolvedValue({ error: null });
    Object.assign(service, { resend: { emails: { send } } });

    await service.sendContactEmail({ ...contact, name: 'Line\nBreak' });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'help@cognify.test',
        replyTo: 'visitor@example.com',
        subject: '[Cognify Support] <b>urgent</b> from Line Break',
      }),
    );
  });

  it('reports delivery failures instead of claiming success', async () => {
    const service = new EmailService(config({ resendApiKey: 're_test_key' }));
    const send = jest
      .fn()
      .mockResolvedValue({ error: { message: 'domain not verified' } });
    Object.assign(service, { resend: { emails: { send } } });

    await expect(service.sendContactEmail(contact)).rejects.toThrow(
      ServiceUnavailableException,
    );
    await expect(
      service.sendVerificationEmail('a@example.com', '123456'),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
